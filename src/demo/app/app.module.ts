import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material';

import { environment } from 'environments/environment';
import { ROUTES } from './app.routes';
// App is our top level component
import '../styles/styles.scss';

import { AppComponent } from './app.component';
import { AppState } from './app.service';
import { HomeComponent, DemoDialogComponent } from './home';
import { NoContentComponent } from './no-content';

import { NgxIpModule } from 'ngx-ip';

// Application wide providers
const APP_PROVIDERS = [
  AppState
];

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AppComponent,
    NoContentComponent,
    HomeComponent,
    DemoDialogComponent
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    MaterialModule,
    NgxIpModule
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    environment.ENV_PROVIDERS,
    APP_PROVIDERS
  ],
  entryComponents: [
    DemoDialogComponent
  ]
})
export class AppModule { }
