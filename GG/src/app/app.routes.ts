import { Routes } from '@angular/router';

import { conSesionGuard, sinSesionGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [sinSesionGuard],
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [conSesionGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: '**',
    redirectTo: '/tabs/inicio',
  },
];
