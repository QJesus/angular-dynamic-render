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
    script: string;
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
            const groups = /<script>([\s\S]+)<\/script>/ig.exec(html);
            this.html = html.replace(groups[0], '');
            this.script = groups[1];
        });
    }

    handleCompileErrorHandler(error: Error) {
        console.error(error);
    }
}
