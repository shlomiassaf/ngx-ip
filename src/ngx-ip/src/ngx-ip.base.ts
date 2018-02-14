import {
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  AbstractControl,
  ValidationErrors,
  ControlValueAccessor,
  Validator
} from '@angular/forms';
import {
  AddressModeLogic,
  noop,
  v4,
  v4WithMask,
  v6,
  mac,
  inputSelection,
  coerceBooleanProperty
} from './utils';

export type ADDRESS_MODE_TYPE = 'ipv4' | 'ipv4WithMask' | 'ipv6' | 'mac';
export type COPY_METHOD = 'block' | 'address';
export type COPY_MODE_TYPE = 'block' | 'address' | 'select';
export type VALIDATION_TYPE = 'none' | 'char' | 'block';

// if supported set it, else try once
let COPY_FEAT_SUPPORTED: null | boolean | 'TEST' = document.queryCommandSupported('copy') ? true : null;

function cancelEvent($event: Event): void {
  $event.preventDefault();
  $event.stopPropagation();
}

const MODE_MAP = {
  'ipv6': v6,
  'mac': mac,
  'ipv4WithMask': v4WithMask,
  'ipv4': v4
};

export class NgxIpBase implements OnChanges, ControlValueAccessor, Validator {
  public blocks: string[];
  public blocksRef: number[];
  public invalidBlocks: boolean[];
  public addr: AddressModeLogic;
  public focused;

  get mode(): ADDRESS_MODE_TYPE {
    return this._mode;
  }

  /**
   * IP format.
   * Valid values: 'ipv4', 'ipv6' or 'mac'
   * @param mode
   */
  @Input()
  set mode(mode: ADDRESS_MODE_TYPE) {
    if (this._mode === mode) {
      return;
    }

    /* We set the separator of the new address logic only if user did not set it explicitly.
       but we also need to support changing of modes so we check old address logic separator to\
       match current, if match then we know user did not set separator to something else and so
       we update new logic separator */
    const setSeparator = !this.addr || this.separator === this.addr.SEP;
    this.addr = MODE_MAP[mode];
    if (!this.addr) {
      throw new Error(`Unknown mode ${mode}`);
    }

    if (setSeparator) {
      this.separator = this.addr.SEP;
    }

    this._mode = mode;
    this.blocks = this.addr.blocks();
    this.blocksRef = [];
    this.invalidBlocks = [];
    this.fullBlocks = 0;
    for (let i = 0; i < this.addr.BLOCK_COUNT; i++) {
      this.fullBlocks |= 1 << (i + 1);
      this.blocksRef[i] = i;
      this.invalidBlocks[i] = false;
    }
  }

  @Input()
  get value(): string { return this._value; };
  set value(v: string) {
    if (v !== this._value) {
      this._value = v;
      this.blocks = this.toBlocks(v);
      this.markValidity();
      this._onChangeCallback(v);
      this._cdr.markForCheck();
      this._cdr.detectChanges();
    }
  }

  get copyMode(): COPY_MODE_TYPE {
    switch (this.autoCopy) {
      case 'DEFAULT_ADDRESS':
        return 'address';
      case 'DEFAULT_BLOCK':
        return 'block';
      default:
        return 'select';
    }
  }

  @Input()
  set copyMode(value: COPY_MODE_TYPE) {

    // if copy is not supported in this browser don't allow select mode.
    if (COPY_FEAT_SUPPORTED === false && value === 'select') {
      value = undefined;
    }

    switch (value) {
      case 'select':
        this.autoCopy = undefined;
        break;
      case 'address':
        this.autoCopy = 'DEFAULT_ADDRESS';
        break;
      default:
        this.autoCopy = 'DEFAULT_BLOCK';
        break;
    }
  }

  /**
   * The separator to use character to use as an octet delimiter.
   * The value has an effect on both UI and UX.
   * On the UI side, this character is what the user see's as the delimiter.
   * On the UX side, when this character value is pressed the focus jumps to the next octet
   * similar to what happens when the user press TAB
   *
   * Another behaviour that changes is the paste operation, paste will split to octets by the specified
   * separator, e.g.: The IP address 10.0.0.1 when pasted and the separator is "," will not split correctly.
   */
  @Input() get separator(): string { return this._separator; }
  set separator(value: string) {
    this._separator = value;
    this.separatorMap = this.addr.blocks().map( b => value);
    this.separatorMap[this.addr.BLOCK_COUNT - 1] = '';
    if (this.addr === v4WithMask) {
      this.separatorMap[this.addr.BLOCK_COUNT - 2] = '/';
    }
  }

  /**
   * The validation level performed on an input.
   * This is a validation performed based on a keystroke. Does not apply to paste.
   * none - No validation
   * char - Only valid char's are allowed (however, invalid value can be set. e.g: 333)
   * block - Only valid char's that compose a valid block are allowed
   *
   * Default: 'block'
   */
  @Input() inputValidation: VALIDATION_TYPE = 'block';

  /**
   * A bit map representing disabled blocks.
   * e.g: [1, 1, 0, 0] will set disabled the first 2 blocks (from the left).
   * Since the component is set to OnPush this is an immutable array, to change the state
   * replace the array (don't change it's items).
   */
  @Input() disabledBlocks: boolean[] = [];

  @Input() get disabled() { return this._disabled; }
  set disabled(value: any) { this._disabled = coerceBooleanProperty(value); }

  @Input()
  get readonly() { return this._readonly; }
  set readonly(value: any) { this._readonly = coerceBooleanProperty(value); }

  @Input()
  get required() { return this._required; }
  set required(value: any) { this._required = coerceBooleanProperty(value); }

  @Output() change = new EventEmitter<string>();

  @ViewChildren('input', { read: ElementRef }) public inputs: QueryList<ElementRef>;

  separatorMap: string[];

  protected errorCount: number = 0;
  protected emptyFlag: number = 0;
  protected fullBlocks: number = 0;

  private _required: boolean = false;
  private _readonly: boolean = false;
  private _disabled: boolean = false;
  private _mode: ADDRESS_MODE_TYPE;
  private _value: string = null;
  private _onTouchedCallback: () => void = noop;
  private _onChangeCallback: (_: any) => void = noop;
  private autoCopy: 'DEFAULT_BLOCK' | 'DEFAULT_ADDRESS' | COPY_METHOD | 'IN_FLIGHT';
  private _separator: string;

  constructor(private _cdr: ChangeDetectorRef) {
    this.mode = 'ipv4';
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('separator' in changes) {
      if (!changes.separator.currentValue) {
        this.separator = this.addr.SEP;
      } else if (this.separator.length > 1) {
        this.separator = this.separator[0];
      }
    }
  }

  isBlockDisabled(idx: number): boolean {
    return this.disabled || this.disabledBlocks[idx];
  }

  validate(c: AbstractControl): ValidationErrors | null {
    if (this.required && this.fullBlocks === this.emptyFlag) {
      return { required: true };
    }
    if (this.errorCount > 0) {
      return { NgxIpControl: 'Invalid address' };
    } else {
      return null;
    }
  }

  writeValue(value: any): void {
    /* This is a special case, we can't just do this.value = value
    because the old value is irrelevant as it might have a value differebt from the input's (not commited yet)
    this call comes from the form so we need to reset everything. */
    this._value = value;
    this.blocks = this.toBlocks(value);
    this.markValidity();
    this._cdr.markForCheck();
    this._cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this._onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouchedCallback = fn;
  }

  /**
   * Override this method to enable custom copy mode user selection.
   * The default implementation does not enable selection and set 'block' mode.
   */
  getUserCopyMethod(): Promise<COPY_METHOD> {
    return Promise.resolve('block' as 'block');
  }

  /**
   * A Copy (ctrl-c) event handler to control the copy behaviour based on
   * the copyMode the user have selected.
   *
   * Do not override this method in extending classes, to provide a custom
   * mode selection UX use getUserCopyMethod()
   *
   * This method handles the whole copy process, including browser support
   * initialization and the "select" copy mode process.
   * @internal
   */
  onCopy($event: ClipboardEvent, idx: number): void {
    switch (COPY_FEAT_SUPPORTED) {
      case 'TEST':
        // if we hit this it means we are testing if copy works on this
        // browser, and it does...
        COPY_FEAT_SUPPORTED = true;
        return;
      case true:
        break;
      case false:
        return; // not supported, returning here will in-effect apply "block" mode.
      case null:
        // make sure recursion will not overflow
        COPY_FEAT_SUPPORTED = 'TEST';
        document.execCommand('copy');
        if (<any> COPY_FEAT_SUPPORTED !== true) {
          // if not supported return without cancelling, resulting in the original copy command
          // passed through as usual, setting COPY_FEAT_SUPPORTED to false also means
          // it will not allow changing the copyMode. We also set the copy mode to the default.
          COPY_FEAT_SUPPORTED = false;
          return;
        }
        break;
      default:
        return;
    }

    try {
      switch (this.autoCopy) {
        case 'block':
          this.autoCopy = undefined;
        case 'DEFAULT_BLOCK':
          return;
        case 'address':
          this.autoCopy = undefined;
        case 'DEFAULT_ADDRESS':
          const value = this.fromBlocks(this.blocks);
          $event.clipboardData.setData('text', value);
          cancelEvent($event);
          break;
        case 'IN_FLIGHT':
          cancelEvent($event);
          break;
        default:
          cancelEvent($event);
          if (inputSelection.all($event.target as any)) {
            this.autoCopy = 'IN_FLIGHT';
            this.getUserCopyMethod()
              .then( method => {
                this.autoCopy = (method === 'address' ? 'address' : 'block');
                this.copyUserSelectedMethod(idx);
              })
              .catch( err => this.autoCopy = undefined );
          }
          break;
      }
    } catch (e) {
    }
  }

  /**
   * A Paste (ctrl-v) event handler to control the paste behaviour.
   * This method can be overriden by extending classes.
   * When overriding, use paste() method.
   */
  onPaste($event: ClipboardEvent, blockIndex: number): void {
    try {
      const data = $event.clipboardData.getData('text');
      this.paste(data, blockIndex);
    } catch (e) { }
    cancelEvent($event);
  }

  onChange(value: string, idx: number): void {
    if (this.blocks[idx] === value) {
      return;
    }
    this.blocks[idx] = value;
    this.markValidity();
    this.notifyChange(this.fromBlocks(this.blocks));
  }

  onKeyPress($event: KeyboardEvent, idx: number): void {
    // safari/ff will cancel copy/paste , chrome wont... so don't mess with it.
    if ($event.metaKey || $event.ctrlKey || $event.altKey) {
      return;
    }

    // browser support (e.g: safari)
    let key = typeof $event.key === 'string' ? $event.key : String.fromCharCode($event.charCode);

    if (key === 'Tab') { // FireFox
      return;
    } else  if (key === this.separator) {
      cancelEvent($event);
      this.focusNext(idx);
    } else if (this.isBackspace($event)) { // for FireFox
      return this.onKeyUp($event, idx);
    }

    const isLast = inputSelection.caretIsLast($event.target as any);
    const value = inputSelection.insert($event.target as any, key);

    if (this.inputValidation === 'char' && !this.addr.RE_CHAR.test(key)) {
      return cancelEvent($event);
    } else if (this.inputValidation === 'block' && !this.addr.RE_BLOCK[idx].test(value)) {
      return cancelEvent($event);
    }

    this.markBlockValidity(value, idx);
    if (!this.invalidBlocks[idx] && isLast && this.addr.isMaxLen(value)) {
      // FireFox will not update the value into the input if we move focus.
      setTimeout(() => this.focusNext(idx, false));
    }
  }

  onKeyUp($event: KeyboardEvent, idx: number): void {
    if (this.isBackspace($event)) {
      const input: HTMLInputElement = $event.target as any;
      const value = input && input.selectionStart >= 0 && input.selectionEnd > input.selectionStart
        ? input.value.substr(0, input.selectionStart) + input.value.substr(input.selectionEnd)
        : input.value.substr(0, input.value.length - 1)
      ;
      this.markBlockValidity(value, idx);
    }
  }

  onBlur(idx: number): void {
    this.focused = false;
  }

  onFocus(idx: number): void {
    if (!this.readonly) {
      this.focused = true;
    }
  }

  protected isBackspace($event: KeyboardEvent): boolean {
    return $event.keyCode === 8 || $event.key === 'Backspace';
  }

  protected getInputElement(blockIndex: number): HTMLInputElement | undefined {
    const input = this.inputs.toArray()[blockIndex];
    return input && input.nativeElement;
  }

  protected paste(data: string, blockIndex: number): boolean {
    let arr = this.addr.split(data, this.separator);
    if (arr.length === this.addr.BLOCK_COUNT) {
      this.value = this.fromBlocks(arr);
    } else {
      const value = inputSelection.insert(this.getInputElement(blockIndex), arr[0]);
      this.onChange(value, blockIndex);
    }
    return true;
  }

  protected reset(): void {
    this.errorCount = 0;
    for (let i = 0; i < this.addr.BLOCK_COUNT; i++) {
      this.invalidBlocks[i] = false;
    }
  }

  /**
   * mark the validity for all blocks
   */
  protected markValidity(): void {
    for (let i = 0; i < this.addr.BLOCK_COUNT; i++) {
      this.markBlockValidity(this.blocks[i], i);
    }
    if (this.fullBlocks === this.emptyFlag) {
      this.reset();
    }
  }

  protected markBlockValidity(value: string, idx: number): void {
    if (!value) {
      this.emptyFlag |= 1 << (idx + 1);
    } else {
      this.emptyFlag &= this.emptyFlag - (1 << (idx + 1));
    }
    const lastHasError = !!this.invalidBlocks[idx];
    this.invalidBlocks[idx] = !this.addr.RE_BLOCK[idx].test(value);
    // Special check for IPv4 with mask. RegExp will accept 0,1,2,3 which are invalid.
    // current address data model can not support this abstraction.
    if (idx === 4 && this.addr === v4WithMask && !this.invalidBlocks[idx]) {
      this.invalidBlocks[idx] = parseInt(value, 10) < 4;
    }
    if (lastHasError && !this.invalidBlocks[idx]) {
      this.errorCount--;
    } else if (!lastHasError && this.invalidBlocks[idx]) {
      this.errorCount++;
    }
  }

  protected focusNext(idx: number, selectRange: boolean = true): void {
    const next = this.getInputElement(idx + 1);
    if (next) {
      next.focus();

      if (selectRange && this.blocks[idx + 1]) {
        next.setSelectionRange(0, this.blocks[idx + 1].toString().length);
      }
    }
  }

  protected toBlocks(value: string): string[] {
    return this.addr.split(value, this.separator);
  }

  protected fromBlocks(blocks: string[]): string {
    if (this.fullBlocks === this.emptyFlag) {
      return '';
    } else {
      return this.addr.fromBlocks(blocks, this.separator);
    }
  }

  private copyUserSelectedMethod(blockIndex: number) {
    try {
      const input: HTMLInputElement = this.getInputElement(blockIndex);
      // we can't use the renderer here since it's async thus will run on the next turn.
      // it will force us to run the copy command in a timeout (after selection was made).
      // this will break clipboard policy on some browsers.
      if (input && input.select) {
        input.select();
      }
      document.execCommand('copy');
    } catch (e) {
      this.autoCopy = 'DEFAULT_BLOCK';
    }
  }

  private notifyChange(value: string): void {
    this._onChangeCallback(value);
    this.change.emit(value);
  }

}
