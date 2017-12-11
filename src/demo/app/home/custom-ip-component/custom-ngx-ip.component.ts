import {
  forwardRef,
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { NgxIpBase } from 'ngx-ip';
import { MatInput } from '@angular/material';

export const ADDRESS_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CustomNgxIpComponent),
  multi: true
};

export const ADDRESS_CONTROL_VALIDATORS: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CustomNgxIpComponent),
  multi: true
};

/*
 In the 'selector' we could have called it 'ngx-ip'
 but in the demo we already import the module, in app that does not import
 NgxIpModule you can do so
*/
@Component({
  selector: 'custom-ngx-ip',
  templateUrl: './custom-ngx-ip.component.html',
  styleUrls: ['./custom-ngx-ip.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ ADDRESS_CONTROL_VALUE_ACCESSOR, ADDRESS_CONTROL_VALIDATORS ]
})
export class CustomNgxIpComponent extends NgxIpBase {
  constructor(cdr: ChangeDetectorRef) {
    super(cdr);
  }
  onChange(value: string, idx: number, input: MatInput): void {
    super.onChange(value, idx);
    const hasError = this.invalidBlocks[idx];
    if (hasError !== input.errorState) {
      input.errorState = hasError;
      input.stateChanges.next();
    }
  }
}
