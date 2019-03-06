import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CompileModule } from './compile/compile.module';
import { RenderComponent } from './render/render.component';

@NgModule({
    declarations: [
        AppComponent,
        RenderComponent,
    ],
    imports: [
        BrowserModule,
        CompileModule,
        HttpClientModule,

        AppRoutingModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
