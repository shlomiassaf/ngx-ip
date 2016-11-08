import { Component } from '@angular/core';
import { MdButtonToggleChange, MdDialogRef } from '@angular/material';

import { IP_VALIDATION_TYPE, COPY_MODE_TYPE } from 'ng2-ip';
@Component({
  selector: 'demo-dialog',
  templateUrl: './demo-dialog.component.html',
})
export class DemoDialogComponent {
  inputValidation: IP_VALIDATION_TYPE = 'block';
  disabledBlocks: boolean[] = [];
  highlightInvalidBlocks = true;
  theme: string = 'default';
  mode: string = 'ipv4';

  copyMode: COPY_MODE_TYPE = 'select';

  ip: string;

  constructor(public dialogRef: MdDialogRef<DemoDialogComponent>) {

  }

  onDisableBlockChange($event: MdButtonToggleChange) {
    // we must change the whole array for this to kick CD.
    this.disabledBlocks = this.disabledBlocks.slice();
    this.disabledBlocks[parseInt($event.value)] = $event.source.checked;
  }
}
