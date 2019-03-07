import { Component, NgModule, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-render',
    templateUrl: './render.component.html',
})
export class RenderComponent implements OnInit {
    context: any;
    html: string;
    scripts: string[];
    decorator: NgModule = {
        declarations: [],
        imports: [],
        exports: [],
        entryComponents: [],
        providers: [],
    };

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
    ) { }

    async ngOnInit() {
        this.route.queryParams.subscribe(async (qs: { [prop: string]: string }) => {
            let htmlUrl = qs.htmlUrl;
            if (!htmlUrl) {
                console.warn(`queryString 'htmlUrl' must assign a value. start with '~' means find from '/assets', otherwise from serve.`);
                console.log(`use default value '~v.html'`);
                htmlUrl = '~v.html';
            }
            const url = `${htmlUrl.startsWith('~') ? `/assets/${htmlUrl.substring(1)}` : htmlUrl}?t=${new Date().valueOf()}`;
            const html = await this.http.get(url, { responseType: 'text', }).toPromise();
            const re = /<script(\b[^>]*)>([\s\S]*?)<\/script>/gm;

            const scripts: string[] = [];
            let match: RegExpExecArray;
            // tslint:disable-next-line:no-conditional-assignment
            while (match = re.exec(html)) {
                scripts.push(!match[1] ? match[2] : match[1]);
            }
            this.html = html;
            this.scripts = scripts;
        });
    }

    handleCompileErrorHandler(error: Error) {
        console.error(error);
    }
}
