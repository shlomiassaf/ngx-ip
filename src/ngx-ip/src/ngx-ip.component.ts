import {
  Component,
  Input,
  ViewEncapsulation,
  forwardRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { NgxIpBase, COPY_METHOD } from './ngx-ip.base';

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
export class NgxIpComponent extends NgxIpBase {
  public containerClass: string[] = [];
  public resolveCopyMethod: (method: COPY_METHOD) => void;
  public inputAnim: string;
  private _highlightInvalidBlocks: boolean = true;

  get highlightInvalidBlocks(): boolean {
    return this._highlightInvalidBlocks;
  }

  /**
   * When true add's the 'ngx-ip-error' class to the block when it's invalid.
   * @param value
   */
  @Input()
  set highlightInvalidBlocks(value: boolean) {
    if (this._highlightInvalidBlocks === value) {
      return;
    }

    this._highlightInvalidBlocks = value;
    this.markValidity();
  }

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
    if (idx > -1) {
      this.containerClass.splice(idx, 1);
    }

    this._theme = value;

    if (value) {
      this.containerClass.push(value);
    }
  }

  private _theme: string = '';

  constructor(cdr: ChangeDetectorRef) {
    super(cdr);
  }

  onCopyDecision(method: COPY_METHOD): void {
    const fn = this.resolveCopyMethod;
    this.resolveCopyMethod = this.inputAnim = undefined;
    if (fn) {
      fn(method);
    }
  }

  getUserCopyMethod(): Promise<COPY_METHOD> {
    this.inputAnim = 'hide';
    return new Promise( resolve => this.resolveCopyMethod = resolve );
  }
}
