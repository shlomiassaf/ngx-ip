import { Component, ViewContainerRef } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';

import { DemoDialogComponent } from './demo-dialog/demo-dialog.component';
import { CustomIpComponentDialogComponent } from './custom-ip-component/custom-ip-component-dialog.component';

@Component({
  selector: 'home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  ip: string = '192.333.0.0';

  dialogRef: MatDialogRef<DemoDialogComponent | CustomIpComponentDialogComponent>;

  constructor(public dialog: MatDialog,
              public viewContainerRef: ViewContainerRef) {

  }

  openDemo() {
    this.dialogRef = this.dialog.open(DemoDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      role: 'dialog'
    });
  }

  openCustomComponentDemo() {
    this.dialogRef = this.dialog.open(CustomIpComponentDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      role: 'dialog'
    });
  }

}
