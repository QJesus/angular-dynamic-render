import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompileComponent } from './compile.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    declarations: [CompileComponent],
    imports: [
        CommonModule,
        SharedModule,
    ],
    exports: [CompileComponent],
})
export class CompileModule { }
