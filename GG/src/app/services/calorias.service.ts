import { Injectable, inject, signal } from '@angular/core';

import { Actividad, Comida, RegistroDia } from '../models/calorias';
import { SupabaseService } from './supabase.service';

/** Fila de la tabla registros_calorias (ver supabase/migrations). */
interface FilaRegistro {
  user_id: string;
  fecha: string;
  comidas: Comida[];
  actividades: Actividad[];
}

/**
 * Comidas y actividades de cada día, guardadas en la tabla registros_calorias.
 * La meta y el peso no están aquí: viven en el perfil.
 */
@Injectable({ providedIn: 'root' })
export class CaloriasService {
  private readonly supabase = inject(SupabaseService);

  /** Un registro por día, con clave "2026-09-26" (la misma forma que la columna fecha). */
  private readonly _registros = signal<Record<string, RegistroDia>>({});
  private usuarioId: string | null = null;

  readonly registros = this._registros.asReadonly();

  /** Reemplaza el registro del día. Un día que queda vacío se borra de la cuenta. */
  guardarDia(fecha: string, registro: RegistroDia) {
    const vacio = !registro.comidas.length && !registro.actividades.length;
    this._registros.update((registros) => {
      const copia = { ...registros };
      if (vacio) {
        delete copia[fecha];
      } else {
        copia[fecha] = registro;
      }
      return copia;
    });

    const usuarioId = this.usuarioId;
    if (!usuarioId) {
      return;
    }
    const tabla = () => this.supabase.client.from('registros_calorias');
    if (vacio) {
      this.supabase.guardar(() =>
        tabla().delete().eq('user_id', usuarioId).eq('fecha', fecha)
      );
    } else {
      const fila = aFila(usuarioId, fecha, registro);
      this.supabase.guardar(() => tabla().upsert(fila));
    }
  }

  // ------------------------------------------------- cuenta (DatosUsuarioService)

  async cargar(usuarioId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('registros_calorias')
      .select('*')
      .eq('user_id', usuarioId)
      .overrideTypes<FilaRegistro[], { merge: false }>();
    if (error) {
      throw error;
    }
    this.usuarioId = usuarioId;
    this._registros.set(
      Object.fromEntries(
        data.map((fila) => [fila.fecha, { comidas: fila.comidas, actividades: fila.actividades }])
      )
    );
  }

  /** Sube todos los días de una vez (primera vez que entra la cuenta). */
  async importar(usuarioId: string, registros: Record<string, RegistroDia>): Promise<void> {
    const filas = Object.entries(registros).map(([fecha, registro]) =>
      aFila(usuarioId, fecha, registro)
    );
    if (!filas.length) {
      return;
    }
    const { error } = await this.supabase.client.from('registros_calorias').upsert(filas);
    if (error) {
      throw error;
    }
  }

  limpiar() {
    this.usuarioId = null;
    this._registros.set({});
  }
}

function aFila(usuarioId: string, fecha: string, registro: RegistroDia): FilaRegistro {
  return {
    user_id: usuarioId,
    fecha,
    comidas: registro.comidas ?? [],
    actividades: registro.actividades ?? [],
  };
}
