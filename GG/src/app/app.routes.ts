import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'calorias',
    loadComponent: () => import('./calorias/calorias.page').then( m => m.CaloriasPage)
  },
  {
    path: 'logros',
    loadComponent: () => import('./logros/logros.page').then( m => m.LogrosPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./perfil/perfil.page').then( m => m.PerfilPage)
  },
];
