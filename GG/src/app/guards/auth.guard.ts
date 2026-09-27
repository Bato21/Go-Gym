import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { DatosUsuarioService } from '../services/datos-usuario.service';

/**
 * Las pestañas solo se abren con sesión y con los datos de la cuenta ya cargados.
 * Si la carga falla, Login muestra el error y deja reintentar.
 */
export const conSesionGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const datos = inject(DatosUsuarioService);
  const router = inject(Router);

  await auth.listo;
  const usuario = auth.usuario();
  if (!usuario) {
    return router.parseUrl('/login');
  }

  try {
    await datos.preparar(usuario);
    return true;
  } catch (error) {
    console.error('Supabase: no se pudieron cargar los datos', error);
    return router.parseUrl('/login?error=carga');
  }
};

/** Con sesión, Login no tiene sentido, salvo para mostrar un error de carga. */
export const sinSesionGuard: CanActivateFn = async (ruta) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.listo;
  if (auth.usuario() && !ruta.queryParamMap.has('error')) {
    return router.parseUrl('/tabs/inicio');
  }
  return true;
};
