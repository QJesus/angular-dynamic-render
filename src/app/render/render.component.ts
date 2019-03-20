import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Component, Input, NgModule, NgModuleFactory, Compiler, SimpleChanges, AfterViewInit, ViewChild, ElementRef, OnChanges, Type, OnInit, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { cloneDeep } from 'lodash';

@Component({
    selector: 'app-render',
    template: `<app-compile [html]="html" [scripts]="scripts" [decorator]="decorator" [errorHandler]="handleCompileErrorHandler"></app-compile>`,
})
export class RenderComponent implements OnInit {
    html: string;
    scripts: string[];
    decorator: NgModule;

    constructor(private http: HttpClient, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(async (qs: { [prop: string]: string }) => {
            let fileUrl = qs.fileUrl;
            if (!fileUrl) {
                // console.warn(`queryString 'fileUrl' must assign a value. start with '~' means find from '/vue-report', otherwise from serve.`);
                // console.warn(`use default value '~demo.vue'`);
                fileUrl = '~demo.vue';
            }
            const url = `${fileUrl.startsWith('~') ? `/vue-report/${fileUrl.substring(1)}` : fileUrl}?t=${new Date().valueOf()}`;
            const html = await this.http.get(url, { responseType: 'text', }).toPromise();
            const ps = this.peelingScripts(html);
            this.scripts = ps.scripts;
            this.html = this.peelingDOM(ps.html);
            this.decorator = {
                declarations: [SafePipe],
                imports: [ExtendedModule],
                exports: [],
                entryComponents: [],
                providers: [],
            };
        });
    }

    private peelingScripts(html: string) {
        let content = html;
        const scripts: string[] = [];
        let match: RegExpExecArray;
        while (match = /<script\b([^>]*)>([\s\S]*?)<\/script>/gm.exec(content)) {
            scripts.push(!!match[1] ? match[1] : match[2]);
            content = content.replace(match[0], '');
        }
        return { html: content.trim(), scripts };
    }

    private peelingDOM = (html: string) => html.replace(/<template>/g, '<ng-container>').replace(/<\/template>/g, '</ng-container>');

    handleCompileErrorHandler(error: Error) {
        // console.error(error);
    }
}

@Component({
    selector: 'app-compile',
    template: `
    <div *ngIf="!!dynamicComponent && !!dynamicModule">
        <ng-container *ngComponentOutlet="dynamicComponent; ngModuleFactory: dynamicModule;"></ng-container>
    </div>
`
})
export class CompileComponent implements OnChanges, OnInit {
    @Input() html: string;
    @Input() scripts: string[];
    @Input() decorator: NgModule;
    @Input() errorHandler: (ex: any) => void = console.error;

    dynamicComponent: Type<any>;
    dynamicModule: NgModuleFactory<any>;

    constructor(private compiler: Compiler) { }

    async ngOnInit() { }

    async ngOnChanges(changes: SimpleChanges) {
        // fixme only update with the required changes
        // console.log(changes);
        if ((!!changes.html && !!changes.html.currentValue) || (!!changes.script && !!changes.script.currentValue)) {
            this.dynamicComponent = undefined;
            this.dynamicModule = undefined;
            try {
                this.dynamicComponent = this.createNewComponent(this.html, this.scripts);
                this.dynamicModule = this.compiler.compileModuleSync(this.createComponentModule(this.dynamicComponent));
            } catch (e) {
                this.errorHandler(e);
            }
        }
    }

    private createNewComponent(html: string, scripts: string[]): Type<any> {
        @Component({
            selector: 'app-dynamic-component',
            template: `
                <div [innerHTML]="html | safe: 'html'"></div>
                <div #el><ng-content></ng-content></div>
            `,
        })
        class DynamicComponent implements OnChanges, OnInit, AfterViewInit {
            @ViewChild('el') element: ElementRef;
            @Input() html: string;
            @Input() scripts: string[];

            ngOnChanges(changes: SimpleChanges) {
                // console.log(changes);
            }

            ngOnInit() {
                this.html = html;
                this.scripts = scripts;
                // console.log({ h: this.html, s: this.scripts });
            }

            async ngAfterViewInit() {
                for (const script of scripts) {
                    const el = document.createElement('script');
                    el.type = 'text/javascript';
                    const match = /src="(.+)"/ig.exec(script);
                    if (!match) {
                        el.innerHTML = script;
                        this.element.nativeElement.appendChild(el);
                    } else {
                        el.src = match[1];
                    }
                }
            }
        }
        return DynamicComponent;
    }

    private createComponentModule(componentType: Type<any>): Type<any> {
        const decorator: NgModule = !!this.decorator ? cloneDeep(this.decorator) : {};
        decorator.declarations = decorator.declarations || [];
        decorator.imports = decorator.imports || [];
        decorator.entryComponents = decorator.entryComponents || [];
        decorator.providers = decorator.providers || [];

        decorator.declarations.push(componentType);
        decorator.entryComponents.push(componentType);

        @NgModule(decorator)
        class RuntimeComponentModule { }
        return RuntimeComponentModule;
    }
}

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
    constructor(protected sanitizer: DomSanitizer) { }

    public transform(value: any, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
        switch (type) {
            case 'html': return this.sanitizer.bypassSecurityTrustHtml(value);
            case 'style': return this.sanitizer.bypassSecurityTrustStyle(value);
            case 'script': return this.sanitizer.bypassSecurityTrustScript(value);
            case 'url': return this.sanitizer.bypassSecurityTrustUrl(value);
            case 'resourceUrl': return this.sanitizer.bypassSecurityTrustResourceUrl(value);
            default: throw new Error(`Invalid safe type specified: ${type}`);
        }
    }
}

// 需要额外添加到动态组件的内容
// 如第三方组件库等
@NgModule({
    declarations: [],
    imports: [CommonModule],
    exports: []
})
export class ExtendedModule { }
