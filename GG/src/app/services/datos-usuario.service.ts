import { Injectable, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';

import { CLAVE_CALORIAS, RegistroDia } from '../models/calorias';
import { CLAVE_PERFIL, PERFIL_INICIAL, Perfil } from '../models/perfil';
import { CLAVE_RUTINAS, RUTINAS_INICIALES, Rutina } from '../models/rutina';
import { CLAVE_EN_CURSO, CLAVE_HISTORIAL, Sesion } from '../models/sesion';
import { escribir, leer } from '../utils/almacenamiento';
import { CaloriasService } from './calorias.service';
import { PerfilService } from './perfil.service';
import { RutinasService } from './rutinas.service';
import { SesionesService, claveEnCurso } from './sesiones.service';

/**
 * Carga los datos de la cuenta en los servicios al entrar, y los borra al salir.
 * Los guards esperan a preparar(): ninguna pestaña se abre con datos a medias.
 */
@Injectable({ providedIn: 'root' })
export class DatosUsuarioService {
  private readonly perfil = inject(PerfilService);
  private readonly rutinas = inject(RutinasService);
  private readonly sesiones = inject(SesionesService);
  private readonly calorias = inject(CaloriasService);

  private preparado?: { usuarioId: string; carga: Promise<void> };

  /** Carga una sola vez por cuenta. Si falla, el siguiente intento vuelve a pedir. */
  preparar(usuario: User): Promise<void> {
    if (this.preparado?.usuarioId !== usuario.id) {
      const carga = this.cargar(usuario).catch((error) => {
        this.preparado = undefined;
        throw error;
      });
      this.preparado = { usuarioId: usuario.id, carga };
    }
    return this.preparado.carga;
  }

  limpiar() {
    this.preparado = undefined;
    this.perfil.limpiar();
    this.rutinas.limpiar();
    this.sesiones.limpiar();
    this.calorias.limpiar();
  }

  private async cargar(usuario: User) {
    const tienePerfil = await this.perfil.cargar(usuario.id);
    if (!tienePerfil) {
      await this.crearCuenta(usuario);
    }
    await Promise.all([
      this.rutinas.cargar(usuario.id),
      this.sesiones.cargar(usuario.id),
      this.calorias.cargar(usuario.id),
    ]);
  }

  /**
   * Primera vez que entra la cuenta: sube lo que este dispositivo tenía guardado
   * de antes de las cuentas o, si no hay nada, las rutinas de ejemplo.
   * El perfil se crea al final: si algo falla antes, el próximo intento repite
   * todo (son upserts, no duplica nada).
   */
  private async crearCuenta(usuario: User) {
    const local = leerDatosLocales();
    const datos = usuario.user_metadata as { nombre?: string; apellido?: string };

    await this.rutinas.importar(usuario.id, local.rutinas ?? RUTINAS_INICIALES);
    await this.sesiones.importar(usuario.id, local.historial);
    await this.calorias.importar(usuario.id, local.registros);
    await this.perfil.crear(usuario.id, {
      ...local.perfil,
      nombre: datos.nombre?.trim() || local.perfil.nombre,
      apellido: datos.apellido?.trim() || local.perfil.apellido,
    });

    borrarDatosLocales(usuario.id);
  }
}

// ------------------------------------------- datos de antes de las cuentas

interface DatosLocales {
  perfil: Perfil;
  /** null si nunca se guardaron rutinas (entonces van las de ejemplo). */
  rutinas: Rutina[] | null;
  historial: Sesion[];
  registros: Record<string, RegistroDia>;
}

/**
 * Lo que la app guardaba en localStorage cuando no había cuentas. La meta y el
 * peso que vivían en Calorías pasan al perfil, como hacía la versión anterior.
 */
function leerDatosLocales(): DatosLocales {
  const perfilGuardado = leer<Partial<Perfil> | null>(CLAVE_PERFIL, null);
  const calorias = leer<{ registros?: Record<string, RegistroDia>; meta?: number; pesoKg?: number }>(
    CLAVE_CALORIAS,
    {}
  );

  const perfil: Perfil = { ...PERFIL_INICIAL, ...perfilGuardado };
  if (perfilGuardado?.pesoKg === undefined) {
    perfil.pesoKg = calorias.pesoKg ?? perfil.pesoKg;
    perfil.metaCalorias = calorias.meta ?? perfil.metaCalorias;
  }

  return {
    perfil,
    rutinas: leer<Rutina[] | null>(CLAVE_RUTINAS, null),
    historial: leer<Sesion[]>(CLAVE_HISTORIAL, []),
    registros: calorias.registros ?? {},
  };
}

/** Ya están en la cuenta: otra cuenta en este dispositivo no debe heredarlos. */
function borrarDatosLocales(usuarioId: string) {
  const enCurso = leer<Sesion | null>(CLAVE_EN_CURSO, null);
  if (enCurso) {
    escribir(claveEnCurso(usuarioId), enCurso);
  }
  for (const clave of [CLAVE_PERFIL, CLAVE_RUTINAS, CLAVE_HISTORIAL, CLAVE_CALORIAS, CLAVE_EN_CURSO]) {
    escribir(clave, null);
  }
}
