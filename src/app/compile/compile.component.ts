import { Component, Input, NgModule, Type, ModuleWithProviders, NgModuleFactory, Compiler, SimpleChanges, AfterViewInit, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cloneDeep } from 'lodash';
import { SharedModule } from '../shared/shared.module';

@Component({
    selector: 'app-compile',
    templateUrl: './compile.component.html'
})
export class CompileComponent implements OnChanges {
    @Input() html: string;
    @Input() scripts: string[];
    @Input() context: any;
    @Input() errorHandler: (ex: any) => void = console.error;
    @Input() decorator: NgModule;
    @Input() imports: Array<Type<any> | ModuleWithProviders | any[]>;

    dynamicComponent: any;
    dynamicModule: NgModuleFactory<any> | any;

    constructor(private compiler: Compiler) { }

    async ngOnChanges(changes: SimpleChanges) {
        // fixme only update with the required changes
        // console.log(changes);
        if ((!!changes.html && !!changes.html.currentValue) || (!!changes.script && !!changes.script.currentValue)) {
            if (!(this.html || '').trim()) {
                this.dynamicComponent = undefined;
                this.dynamicModule = undefined;
            } else {
                try {
                    this.dynamicComponent = this.createNewComponent(this.html, this.scripts, this.context);
                    this.dynamicModule = this.compiler.compileModuleSync(this.createComponentModule(this.dynamicComponent));
                } catch (e) {
                    this.errorHandler(e);
                }
            }
        }
    }

    private createNewComponent(html: string, scripts: string[], context: any) {
        @Component({
            selector: 'app-dynamic-component',
            template: `
                <div [innerHTML]="html | safe: 'html'"></div>
                <div #el><ng-content></ng-content></div>
            `,
        })
        class DynamicComponent implements AfterViewInit {
            @ViewChild('el') element: ElementRef;
            context = context;
            html = html || '<div></div>';

            async ngAfterViewInit() {
                for (const script of scripts) {
                    const el = document.createElement('script');
                    el.type = 'text/javascript';
                    const match = /src="(.+)"/ig.exec(script);
                    if (!match) {
                        el.innerHTML = script;
                    } else {
                        el.src = match[1];
                    }
                    this.element.nativeElement.appendChild(el);
                }
            }
        }
        return DynamicComponent;
    }

    private createComponentModule(componentType: any) {
        const decorator: NgModule = !!this.decorator ? cloneDeep(this.decorator) : {};
        decorator.declarations = decorator.declarations || [];
        decorator.imports = decorator.imports || [];
        decorator.entryComponents = decorator.entryComponents || [];
        decorator.providers = decorator.providers || [];

        decorator.declarations.push(componentType);
        decorator.imports.push(CommonModule, SharedModule, this.imports || []);
        decorator.entryComponents.push(componentType);

        @NgModule(decorator)
        class RuntimeComponentModule { }
        return RuntimeComponentModule;
    }
}
