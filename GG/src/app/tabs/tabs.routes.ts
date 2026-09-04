import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('../inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'entrenamiento',
        loadComponent: () =>
          import('../entrenamiento/entrenamiento.page').then(
            (m) => m.EntrenamientoPage
          ),
      },
      {
        path: 'rutina',
        loadComponent: () =>
          import('../rutina/rutina.page').then((m) => m.RutinaPage),
      },
      {
        path: 'calorias',
        loadComponent: () =>
          import('../calorias/calorias.page').then((m) => m.CaloriasPage),
      },
      {
        path: 'logros',
        loadComponent: () =>
          import('../logros/logros.page').then((m) => m.LogrosPage),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: '',
        redirectTo: '/tabs/inicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/inicio',
    pathMatch: 'full',
  },
];
