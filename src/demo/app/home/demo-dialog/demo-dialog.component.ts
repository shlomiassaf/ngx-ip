import { Component } from '@angular/core';
import { MatButtonToggleChange, MatDialogRef } from '@angular/material';
import { highlightAuto } from 'highlight.js';

import { VALIDATION_TYPE, COPY_MODE_TYPE } from 'ngx-ip';

const code = {
  ts: require('!!raw-loader!./demo-dialog.component.ts'),
  html: require('!!raw-loader!./demo-dialog.component.html'),
};

@Component({
  selector: 'demo-dialog',
  templateUrl: './demo-dialog.component.html'
})
export class DemoDialogComponent {
  showCode: boolean;
  inputValidation: VALIDATION_TYPE = 'block';
  disabledBlocks: boolean[] = [];
  highlightInvalidBlocks = true;
  theme: string = 'default';
  mode: string = 'ipv4';
  disabled: boolean;
  readonly: boolean;
  separator: string;
  copyMode: COPY_MODE_TYPE = 'select';

  ip: string;

  get htmlCode() {
    return this.code.html || (this.code.html = highlightAuto(code.html, ['html']).value);
  }

  get tsCode() {
    return this.code.ts || (this.code.ts = highlightAuto(code.ts, ['typescript']).value);
  }

  private code: { ts: string, html: string } = <any> {};

  constructor(public dialogRef: MatDialogRef<DemoDialogComponent>) {

  }

  onDisableBlockChange($event: MatButtonToggleChange) {
    // we must change the whole array for this to kick CD.
    this.disabledBlocks = this.disabledBlocks.slice();
    const value = parseInt($event.value, 10);
    if (value === -1) {
      this.disabled = $event.source.checked;
    } else {
      this.disabledBlocks[value] = $event.source.checked;
    }
  }
}
