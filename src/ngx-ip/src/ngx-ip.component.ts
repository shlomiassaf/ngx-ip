import {
  Component,
  Input,
  ViewEncapsulation,
  forwardRef,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {trigger, transition, style, animate, state} from '@angular/animations';
import {
  AbstractControl,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
  Validator,
  ValidationErrors
} from '@angular/forms';

import { AddressModeLogic, noop, v4, v6, mac, inputSelection, coerceBooleanProperty } from './utils';

export type ADDRESS_MODE_TYPE = 'ipv4' | 'ipv6' | 'mac';
export type COPY_MODE_TYPE = 'block' | 'address' | 'select';
export type VALIDATION_TYPE = 'none' | 'char' | 'block';

// if supported set it, else try once
let COPY_FEAT_SUPPORTED: boolean = document.queryCommandSupported('copy') ? true : undefined;

function isV6(mode: ADDRESS_MODE_TYPE) {
  return mode === 'ipv6';
}

function isMac(mode: ADDRESS_MODE_TYPE) {
  return mode === 'mac';
}

export const ADDRESS_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NgxIpComponent),
  multi: true
};

export const ADDRESS_CONTROL_VALIDATORS: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => NgxIpComponent),
  multi: true
};

function cancelEvent($event: Event): void {
  $event.preventDefault();
  $event.stopPropagation();
}

@Component({
  selector: 'ngx-ip',
  templateUrl: './ngx-ip.component.html',
  styleUrls: ['./ngx-ip.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ ADDRESS_CONTROL_VALUE_ACCESSOR, ADDRESS_CONTROL_VALIDATORS ],
  animations: [
    trigger('copyAnim', [
      transition('void => *', [
        style({
          transform: 'translateY(-100%)'
        }),
        animate('0.25s')
      ]),
      transition('* => void', [
        animate('0.25s', style({
          transform: 'translateY(-100%)'
        }))
      ])
    ]),
    trigger('inputAnim', [
      state('hide', style({opacity: 0})),
      transition('* => hide', [
        animate('0.25s', style({
          transform: 'translateY(100%)'
        }))
      ]),
      transition('hide => *', [
        style({
          transform: 'translateY(100%)'
        }),
        animate('0.25s')
      ])
    ])
  ]
})
export class NgxIpComponent implements OnChanges, ControlValueAccessor, Validator {
  public blocks: string[];
  public blocksRef: number[];
  public invalidBlocks: boolean[];
  public containerClass: string[] = [];
  public addr: AddressModeLogic;
  public showCopySelection: boolean;
  public inputAnim: string;

  get focused(): boolean {
    return this.containerClass.indexOf('ngx-ip-focused') > -1;
  }

  set focused(value: boolean) {
    const idx = this.containerClass.indexOf('ngx-ip-focused');
    if (value && idx === -1) {
      this.containerClass.push('ngx-ip-focused');
    } else if (!value && idx > -1) {
      this.containerClass.splice(idx, 1);
    }
  }

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
    this.addr = isV6(mode) ? v6 : isMac(mode) ? mac : v4;
    if (setSeparator) {
      this.separator = this.addr.SEP;
    }

    this._mode = mode;
    this.blocks = this.addr.blocks();
    this.blocksRef = this.blocks.map((v, i) => i);
    this.invalidBlocks = this.addr.blocks().map( b => false );
  }

  get value(): string {
    return this._value;
  };

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
  @Input() separator: string;

  @Input()
  set value(v: string) {
    if (v !== this._value) {
      this._value = v;
      this.blocks = this.toBlocks(v);
      this._onChangeCallback(v);

      if (!v) {
        for (let i = 0; i < this.blocks.length; i++) {
          this.invalidBlocks[i] = undefined;
        }
      } else {
        for (let i = 0; i < this.blocks.length; i++) {
          this.markBlockValidity(this.blocks[i], i);
        }
      }

      this._cdr.markForCheck();
      this._cdr.detectChanges();
    }
  }

  get highlightInvalidBlocks(): boolean {
    return this._highlightInvalidBlocks;
  }

  /**
   * When true add's the 'ngx-ip-error' class to the block when it's invalid.
   * @param value
   */
  @Input()
  set highlightInvalidBlocks(value: boolean) {
    if (this._highlightInvalidBlocks === value) return;

    this._highlightInvalidBlocks = value;
    for (let i = 0; i < this.blocks.length; i++) {
      this.markBlockValidity(this.blocks[i], i);
    }
  }

  get theme(): string {
    return this._theme;
  }

  /**
   * The CSS class representing the theme of this instance.
   * @param value
   */
  @Input()
  set theme(value: string) {
    if (this._theme === value) {
      return;
    }

    let idx = this.containerClass.indexOf(this._theme);
    if (idx > -1) this.containerClass.splice(idx, 1);

    this._theme = value;

    if (value) {
      this.containerClass.push(value);
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

  @Output() change = new EventEmitter<string>();

  @ViewChildren('input') public inputs: QueryList<ElementRef>;

  private _readonly: boolean = false;
  private _disabled: boolean = false;
  private _mode: ADDRESS_MODE_TYPE;
  private _value: string = null;
  private _onTouchedCallback: () => void = noop;
  private _onChangeCallback: (_: any) => void = noop;
  private _theme: string = '';
  private _highlightInvalidBlocks: boolean = true;
  private autoCopy: string;
  private errorCount: number = 0;

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
    if (this.errorCount > 0) {
      return { NgxIpControl: 'Invalid address' };
    } else {
      return null;
    }
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this._onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouchedCallback = fn;
  }

  onPaste($event: ClipboardEvent, idx: number): void {
    try {
      let clipData: any = $event.clipboardData.getData('text');

      if (typeof clipData === 'string') {
        let arr = clipData.split(this.separator);
        if (arr.length === this.addr.BLOCK_COUNT) {
          this.value = this.fromBlocks(arr);
        } else {
          const value = inputSelection.insert($event.target as any, arr[0]);
          this.onChange(value, idx);
        }

        cancelEvent($event);
      }
    } catch (e) {
    }
  }

  onCopy($event: ClipboardEvent, idx: number): void {
    try {
      this.showCopySelection = false;
      this.inputAnim = undefined;
      switch (this.autoCopy) {
        case 'TEST_MODE':
          COPY_FEAT_SUPPORTED = true;
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
        default:
          if (inputSelection.all($event.target as any)) {

            // fail safe protection when copy paste is not supported.
            if (typeof COPY_FEAT_SUPPORTED === 'undefined') {
              // make sure recursion will not overflow
              this.autoCopy = 'TEST_MODE';
              // set to false, if supported it will change to true
              COPY_FEAT_SUPPORTED = false;

              document.execCommand('copy');

              // if not supported return without cancelling, resulting in the original copy command
              // passed through as usual, setting COPY_FEAT_SUPPORTED to false also means
              // it will not allow changing the copyMode. We also set the copy mode to the default.
              if (COPY_FEAT_SUPPORTED === false) {
                this.autoCopy = 'DEFAULT_BLOCK';
                return;
              }
            }

            this.autoCopy = idx.toString();
            this.showCopySelection = true;
            this.inputAnim = 'hide';
            cancelEvent($event);
          }
          break;
      }
    } catch (e) {
    }
  }

  onCopyDecision(decision: 'block' | 'address') {
    switch (decision) {
      case 'block':
      case 'address':
        try {
          const idx = parseInt(this.autoCopy);
          this.autoCopy = decision;
          const input: HTMLInputElement = this.inputs.toArray()[idx].nativeElement as any;

          // we can't use the renderer here since it's async thus will run on the next turn.
          // it will force us to run the copy command in a timeout (after selection was made).
          // this will break clipboard policy on some browsers.
          input && input.select && input.select();

          document.execCommand('copy');

        } catch (e) {
          this.autoCopy = 'DEFAULT_BLOCK';
        }
        break;
      default:
        this.autoCopy = undefined;
    }
  }

  onChange(value: string, idx: number): void {
    if (this.blocks[idx] === value) {
      return;
    }
    this.blocks[idx] = value;
    this.markBlockValidity(value, idx);
    this.notifyChange(this.fromBlocks(this.blocks));
  }

  onKeyPress($event: KeyboardEvent, idx: number): void {
    // safari/ff will cancel copy/paste , chrome wont... so don't mess with it.
    if ($event.metaKey || $event.ctrlKey || $event.altKey) {
      return;
    }

    // browser support (e.g: safari)
    let key = typeof $event.key === 'string' ? $event.key : String.fromCharCode($event.charCode);

    if (key === this.separator) {
      cancelEvent($event);
      this.focusNext(idx);
    }

    const isLast = inputSelection.caretIsLast($event.target as any);
    const value = inputSelection.insert($event.target as any, key);

    if (this.inputValidation === 'char' && !this.addr.RE_CHAR.test(key)) {
      return cancelEvent($event);
    } else if (this.inputValidation === 'block' && !this.addr.RE_BLOCK.test(value)) {
      return cancelEvent($event);
    }

    this.markBlockValidity(value, idx);
    if (!this.invalidBlocks[idx] && isLast && this.addr.isMaxLen(value)) {
      this.focusNext(idx, false);
    }
  }

  onKeyUp($event: KeyboardEvent, idx: number): void {
    if (typeof $event.keyCode === 'number') {
      if ($event.keyCode !== 8) {
        return;
      }
    } else if ($event.key !== 'Backspace') {
      return;
    }

    const input: HTMLInputElement = $event.target as any;
    const value = input && input.selectionStart >= 0 && input.selectionEnd > input.selectionStart
      ? input.value.substr(0, input.selectionStart) + input.value.substr(input.selectionEnd)
      : input.value.substr(0, input.value.length - 1)
    ;

    this.markBlockValidity(value, idx);
  }

  onBlur(idx: number): void {
    this.focused = false;
  }

  onFocus(idx: number): void {
    if (!this.readonly) {
      this.focused = true;
    }
  }

  private focusNext(idx: number, selectRange: boolean = true): void {
    const next = this.inputs.toArray()[idx + 1];
    if (next) {
      next.nativeElement.focus();

      if (selectRange && this.blocks[idx + 1]) {
        next.nativeElement.setSelectionRange(0, this.blocks[idx + 1].toString().length);
      }
    }
  }

  private markBlockValidity(value: string, idx: number): void {
    const lastHasError = !!this.invalidBlocks[idx];
    this.invalidBlocks[idx] = !this.addr.RE_BLOCK.test(value);
    if (lastHasError && !this.invalidBlocks[idx]) {
      this.errorCount--;
    } else if (!lastHasError && this.invalidBlocks[idx]) {
      this.errorCount++;
    }
  }

  private notifyChange(value: string): void {
    this._onChangeCallback(value);
    this.change.emit(value);
  }

  private toBlocks(value: string): string[] {
    return this.addr.split(value, this.separator);
  }

  private fromBlocks(blocks: string[]): string {
    return this.addr.fromBlocks(blocks, this.separator);
  }
}
