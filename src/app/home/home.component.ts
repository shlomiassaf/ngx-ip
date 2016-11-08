import { Component, ViewContainerRef } from '@angular/core';
import { MdUniqueSelectionDispatcher, MdDialog, MdDialogRef } from '@angular/material';

import { DemoDialogComponent } from './demo-dialog/demo-dialog.component';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  providers: [MdUniqueSelectionDispatcher]
})
export class HomeComponent {
  ip: string = '192.333.0.0';

  dialogRef: MdDialogRef<DemoDialogComponent>;

  constructor(public dialog: MdDialog,
              public viewContainerRef: ViewContainerRef) {

  }

  openDemo() {
    this.dialogRef = this.dialog.open(DemoDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      role: 'dialog'
    });
  }

}
