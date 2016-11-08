import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Ng2IpComponent } from './ng2-ip.component';

@NgModule({
  declarations: [ Ng2IpComponent ],
  imports: [ CommonModule, FormsModule ],
  exports: [ Ng2IpComponent ]
})
export class Ng2IpModule {
}

