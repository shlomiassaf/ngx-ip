import {
  Component, Input, ViewEncapsulation, forwardRef, Output, EventEmitter, ViewChildren,
  QueryList, ElementRef, Renderer, ChangeDetectionStrategy, ChangeDetectorRef,
  trigger, transition, style, animate, state
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import { noop, v4, v6, inputSelection } from './utils';

export type IPV_MODE_TYPE = 'ipv4' | 'ipv6';
export type COPY_MODE_TYPE = 'block' | 'address' | 'select'
export type IP_VALIDATION_TYPE = 'none' | 'char' | 'block';

// if supported set it, else try once
let COPY_FEAT_SUPPORTED: boolean = document.queryCommandSupported('copy') ? true : undefined;

function isV6(mode: IPV_MODE_TYPE) {
  return mode === 'ipv6';
}

export const ANGULAR2_IP_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Ng2IpComponent),
  multi: true
};

function cancelEvent($event: Event): void {
  $event.preventDefault();
  $event.stopPropagation();
}


@Component({
  selector: 'ng2-ip',
  templateUrl: './ng2-ip.component.html',
  styleUrls: [
    './ng2-ip.component.css'
  ],
//   template: `
// <div class="ng2-ip-container" [ngClass]="containerClass">
//   <div class="ng2-ip-table" [@inputAnim]="inputAnim">
//     <template ngFor let-idx [ngForOf]="blocksRef"; let-isLast="last">
//       <div class="ng2-ip-table-cell" [class.ng2-ip-disabled]="disabledBlocks[idx]" [ngClass]="invalidBlocks[idx]">
//         <input #input
//                [value]="blocks[idx] || ''"
//                (change)="onChange($event.target.value, idx)"
//                (blur)="onBlur(idx)"
//                (focus)="onFocus(idx)"
//                [disabled]="disabledBlocks[idx]"
//                (paste)="onPaste($event, idx)"
//                (copy)="onCopy($event, idx)"
//                (keypress)="onKeyPress($event, idx)"
//                (keyup)="onKeyUp($event, idx)"/>
//       </div>
//       <span class="ng2-ip-table-cell ng2-ip-sep" *ngIf="!isLast">{{vX.SEP}}</span>
//     </template>
//   </div>
//   <div class="ng2-ip-copy-overlay" *ngIf="showCopySelection">
//     <div class="ng2-ip-table" [@copyAnim]="">
//       <div class="ng2-ip-copy-title">Copy?</div>
//       <a (click)="onCopyDecision('block')">Block</a>
//       <a (click)="onCopyDecision('address')">Address</a>
//     </div>
//   </div>
// </div>`,
//   styles: [`
// .ng2-ip-container {
//   position: relative;
//   margin: 5px 0;
//   padding: 2px 0;
//   overflow: hidden;
// }
//
// .ng2-ip-copy-overlay {
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   overflow: hidden;
// }
//
// .ng2-ip-copy-overlay .ng2-ip-table {
//   height: 100%;
// }
//
// .ng2-ip-copy-overlay .ng2-ip-table > * {
//   display: table-cell;
//   text-align: center;
//   vertical-align: middle;
// }
//
// .ng2-ip-copy-title {
//   text-align: center;
//   vertical-align: middle;
//   font-size: 0.75em;
// }
//
// .ng2-ip-copy-overlay .ng2-ip-table > a {
//   border: 1px solid #9e9e9e;
//   cursor: pointer;
// }
//
//
//
// .ng2-ip-table {
//   display: inline-table;
//   flex-flow: column;
//   vertical-align: bottom;
//   width: 100%;
// }
//
// .ng2-ip-table-cell {
//   position: relative;
//   display: table-cell;
//   text-align: center;
// }
//
// .ng2-ip-table input {
//   text-align: center;
//   width: 100%;
//   box-sizing: border-box;
// }
//
// /* Default Theme */
// .ng2-ip-theme-default.ng2-ip-container {
//   border: 1px solid #26a69a;
// }
//
//
// .ng2-ip-theme-default .ng2-ip-table-cell {
//   transition: all 0.3s;
// }
//
// .ng2-ip-theme-default .ng2-ip-table input {
//   background: transparent;
//   border: none;
//   outline: none;
// }
//
// .ng2-ip-theme-default .ng2-ip-table-cell.ng2-ip-error {
//   box-shadow: 0 2px 15px 0 #F44336;
// }
//
// /* Boxed Theme */
// .ng2-ip-theme-boxed input {
//   transition: all 0.3s;
// }
// .ng2-ip-theme-boxed .ng2-ip-error:not(.ng2-ip-disabled) input {
//   border-color: #F44336;
// }
//
//
// /* MATERIAL THEME */
// .ng2-ip-theme-material.ng2-ip-container {
//   background-color: transparent;
//   border: none;
//   box-sizing: content-box;
//   transition: all 0.3s;
//   font-size: 1rem;
// }
//
// .ng2-ip-theme-material .ng2-ip-table-cell {
//   border-bottom: 1px solid #9e9e9e;
//   transition: all 0.3s;
// }
//
// .ng2-ip-theme-material.ng2-ip-focused .ng2-ip-table-cell:not(.ng2-ip-disabled) {
//   border-bottom: 1px solid #26a69a;
//   box-shadow: 0 1px 0 0 #26a69a;
// }
//
//
// .ng2-ip-theme-material .ng2-ip-table-cell.ng2-ip-error:not(.ng2-ip-disabled) {
//   box-shadow: 0 1px 0 0 #F44336;
// }
//
// .ng2-ip-theme-material .ng2-ip-table-cell.ng2-ip-disabled {
//   border-bottom: 1px dotted rgba(0,0,0,0.26);
// }
//
// .ng2-ip-theme-material input {
//   background: transparent;
//   border: none;
//   outline: none;
//
//   height: 3rem;
//   font-size: 1rem;
//   padding: 0;
//   box-shadow: none;
// }
//
// .ng2-ip-theme-material input[disabled] {
//   color: rgba(0,0,0,0.26);
// }`
//   ],
  providers: [ANGULAR2_IP_CONTROL_VALUE_ACCESSOR],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('copyAnim', [
      transition("void => *", [
        style({
          transform: 'translateY(-100%)'
        }),
        animate('0.25s')
      ]),
      transition("* => void", [
        animate('0.25s', style({
          transform: 'translateY(-100%)'
        }))
      ])
    ]),
    trigger('inputAnim', [
      state('hide', style({opacity: 0})),
      transition("* => hide", [
        animate('0.25s', style({
          transform: 'translateY(100%)'
        }))
      ]),
      transition("hide => *", [
        style({
          transform: 'translateY(100%)'
        }),
        animate('0.25s')
      ])
    ])
  ]
})
export class Ng2IpComponent implements ControlValueAccessor {
  public blocks: string[] = v4.blocks();
  public blocksRef: number[] = this.blocks.map( (v, i) => i);
  public invalidBlocks: string[] = [];
  public containerClass: string[] = [];
  public vX: typeof v6 | typeof v4 = v4;
  public showCopySelection: boolean;
  public inputAnim: string;

  get focused(): boolean {
    return this.containerClass.indexOf('ng2-ip-focused') > -1;
  }

  set focused(value: boolean) {
    const idx = this.containerClass.indexOf('ng2-ip-focused');
    if (value && idx === -1) {
      this.containerClass.push('ng2-ip-focused');
    } else if (!value && idx > -1) {
      this.containerClass.splice(idx, 1);
    }
  }

  get mode(): IPV_MODE_TYPE {
    return this._mode;
  }

  /**
   * IP format.
   * Valid values: "ipv4" or "ipv6"
   * @param mode
   */
  @Input() set mode(mode: IPV_MODE_TYPE) {
    if (this._mode === mode) return;

    this.vX = isV6(mode) ? v6: v4;

    this._mode = mode;
    this.blocks = this.vX.blocks();
    this.blocksRef = this.blocks.map( (v, i) => i);
  }

  get value(): string { return this._value; };

  @Input() set value(v: string) {
    if (v !== this._value) {
      this._value = v;
      this.blocks = this.toBlocks(v);
      this._onChangeCallback(v);

      if (!v) {
        for (let i=0; i<this.blocks.length; i++) {
          this.invalidBlocks[i] = undefined;
        }
      } else {
        for (let i=0; i<this.blocks.length; i++) {
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
   * When true add's the 'ng2-ip-error' class to the block when it's invalid.
   * @param value
   */
  @Input() set highlightInvalidBlocks(value: boolean) {
    if (this._highlightInvalidBlocks === value) return;

    this._highlightInvalidBlocks = value;
    for (let i=0; i<this.blocks.length; i++) {
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
  @Input() set theme(value: string) {
    if (this._theme === value) return;

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

  @Input() set copyMode(value: COPY_MODE_TYPE) {

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
   * @type {string}
   */
  @Input() inputValidation: IP_VALIDATION_TYPE = 'block';


  /**
   * A bit map representing disabled blocks.
   * e.g: [1, 1, 0, 0] will set disabled the first 2 blocks (from the left).
   * Since the component is set to OnPush this is an immutable array, to change the state
   * replace the array (don't change it's items).
   * @type {Array}
   */
  @Input() disabledBlocks: boolean[] = [];


  @Output() change = new EventEmitter<string>();


  @ViewChildren('input') private inputs: QueryList<ElementRef>;
  private _mode: IPV_MODE_TYPE = 'ipv4';
  private _value: string = null;
  private _onTouchedCallback: () => void = noop;
  private _onChangeCallback: (_: any) => void = noop;
  private _theme: string = '';
  private _highlightInvalidBlocks: boolean = true;
  private autoCopy: string;

  constructor(private _renderer: Renderer, private _cdr: ChangeDetectorRef) {

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
      let clipData: any = $event.clipboardData.getData("text");

      if (typeof clipData === 'string') {
        let arr = clipData.split(this.vX.SEP);
        if (arr.length === this.vX.BLOCK_COUNT) {
          this.value = this.fromBlocks(arr);
        } else {
          const value = inputSelection.insert($event.target as any, arr[0]);
          this.onChange(value, idx);
        }

        cancelEvent($event);
      }

    } catch (e) {}
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
    } catch (e) { }
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
    if (this.blocks[idx] === value) return;
    this.blocks[idx] = value;
    this.notifyChange(this.fromBlocks(this.blocks));
    this.markBlockValidity(value, idx);
  }

  onKeyPress($event: KeyboardEvent, idx: number): void {
    // safari/ff will cancel copy/paste , chrome wont... so don't mess with it.
    if ($event.metaKey || $event.ctrlKey || $event.altKey) return;

    // browser support (e.g: safari)
    let key = typeof $event.key === 'string' ? $event.key : String.fromCharCode($event.charCode);

    if (key === this.vX.SEP) {
      cancelEvent($event);
      this.focusNext(idx);
    }

    const value = inputSelection.insert($event.target as any, key);

    if (this.inputValidation === 'char' && !this.vX.RE_CHAR.test(key)) {
      return cancelEvent($event);
    } else if (this.inputValidation === 'block' && !this.vX.RE_BLOCK.test(value)) {
      return cancelEvent($event);
    }

    this.markBlockValidity(value, idx);
  }

  onKeyUp($event: KeyboardEvent, idx: number): void {
    if (typeof $event.keyCode === 'number') {
      if ($event.keyCode !== 8) return;
    } else if ($event.key !== 'Backspace') return;


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
    this.focused = true;
  }

  private focusNext(idx: number, selectRange: boolean = true): void {
    const next = this.inputs.toArray()[idx+1];
    if (next) {
      this._renderer.invokeElementMethod(next.nativeElement, 'focus');

      if (selectRange && this.blocks[idx+1]) {
        this._renderer.invokeElementMethod(
          next.nativeElement,
          'setSelectionRange',
          [0, this.blocks[idx+1].toString().length]
        );
      }
    }
  }

  private markBlockValidity(value: string, idx: number): void {
    this.invalidBlocks[idx] = !this.highlightInvalidBlocks || this.vX.RE_BLOCK.test(value) ? undefined : 'ng2-ip-error';
  }
  private notifyChange(value: string): void {
    this._onChangeCallback(value);
    this.change.emit(value);
  }

  private toBlocks(value: string): string[] {
    return this.vX.split(value);
  }

  private fromBlocks(blocks: string[]): string {
    return this.vX.fromBlocks(blocks);
  }
}
