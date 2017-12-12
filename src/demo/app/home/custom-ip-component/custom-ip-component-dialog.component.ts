import { Component, ViewEncapsulation } from '@angular/core';
import { highlightAuto } from 'highlight.js';

const code = {
  ts: require('!!raw-loader!./custom-ngx-ip.component.ts'),
  html: require('!!raw-loader!./custom-ngx-ip.component.html'),
  scss: require('!!raw-loader!./custom-ngx-ip.component.scss')
};

const htmlUsageCode = `
<custom-ngx-ip [(ngModel)]="ip"
               mode="ipv4"
               inputValidation="block"
               copyMode="address"></custom-ngx-ip>`;

@Component({
  selector: 'custom-ip-component-dialog',
  templateUrl: './custom-ip-component-dialog.component.html',
  styleUrls: [ './custom-ip-component-dialog.component.scss' ],
  encapsulation: ViewEncapsulation.None
})
export class CustomIpComponentDialogComponent {
  mode: string = 'ipv4';
  showCode: boolean;
  ip: string;

  htmlUsageCode = highlightAuto(htmlUsageCode, ['html']).value;

  get htmlCode() {
    return this.code.html || (this.code.html = highlightAuto(code.html, ['html']).value);
  }

  get tsCode() {
    return this.code.ts || (this.code.ts = highlightAuto(code.ts, ['typescript']).value);
  }

  get scssCode() {
    return this.code.scss || (this.code.scss = highlightAuto(code.scss, ['scss']).value);
  }

  private code: { ts: string, html: string, scss: string } = <any> {};
}
