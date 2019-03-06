import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RenderComponent } from './render/render.component';

const routes: Routes = [
    { path: '', redirectTo: 'render', pathMatch: 'full', },
    { path: 'render', component: RenderComponent, },
    { path: '**', redirectTo: 'redner', }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
