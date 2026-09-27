import { Injectable, computed, inject, signal } from '@angular/core';

import { Ejercicio, Rutina } from '../models/rutina';
import { SesionesService } from './sesiones.service';
import { SupabaseService } from './supabase.service';

/** Datos editables de una rutina (todo menos id y ejercicios). */
export type DatosRutina = Pick<Rutina, 'nombre' | 'categoria' | 'nivel' | 'minutos'>;

/** Datos editables de un ejercicio (todo menos el id). */
export type DatosEjercicio = Omit<Ejercicio, 'id'>;

/** Fila de la tabla rutinas (ver supabase/migrations). */
interface FilaRutina {
  user_id: string;
  id: number;
  nombre: string;
  categoria: string;
  nivel: string;
  minutos: number;
  ejercicios: Ejercicio[];
}

/**
 * Rutinas del usuario, guardadas en la tabla rutinas de Supabase.
 * Rutina las edita; Inicio, Entrenamiento y Perfil las leen.
 * Cada cambio crea arreglos nuevos para que los signals avisen a todas las vistas,
 * y después sube a la cuenta solo la rutina que cambió.
 */
@Injectable({ providedIn: 'root' })
export class RutinasService {
  private readonly sesiones = inject(SesionesService);
  private readonly supabase = inject(SupabaseService);

  private readonly _rutinas = signal<Rutina[]>([]);
  private usuarioId: string | null = null;

  readonly rutinas = this._rutinas.asReadonly();

  /** Rutinas que se pueden empezar: las que tienen al menos un ejercicio. */
  readonly disponibles = computed(() =>
    this._rutinas().filter((r) => r.ejercicios.length > 0)
  );

  /**
   * Rotación: la rutina que sigue a la última entrenada.
   * Sin historial, la primera de la lista.
   */
  readonly siguiente = computed(() => this.proximas(1)[0]);

  obtener(id: number | null | undefined): Rutina | undefined {
    return this._rutinas().find((r) => r.id === id);
  }

  /** Las próximas n rutinas de la rotación, empezando por la siguiente. */
  proximas(cantidad: number): Rutina[] {
    const lista = this.disponibles();
    if (!lista.length) {
      return [];
    }
    const ultima = this.sesiones
      .historial()
      .find((s) => lista.some((r) => r.id === s.rutinaId));
    const inicio = ultima ? lista.findIndex((r) => r.id === ultima.rutinaId) + 1 : 0;
    return Array.from({ length: cantidad }, (_, i) => lista[(inicio + i) % lista.length]);
  }

  // ---------------------------------------------------------------- rutinas

  crear(datos: DatosRutina): Rutina {
    const nueva: Rutina = { id: this.siguienteIdRutina(), ...datos, ejercicios: [] };
    this._rutinas.set([...this._rutinas(), nueva]);
    this.subir(nueva.id);
    return nueva;
  }

  actualizar(id: number, datos: DatosRutina) {
    this._rutinas.set(this._rutinas().map((r) => (r.id === id ? { ...r, ...datos } : r)));
    this.subir(id);
  }

  duplicar(id: number): Rutina | undefined {
    const rutina = this.obtener(id);
    if (!rutina) {
      return undefined;
    }
    let idEjercicio = this.siguienteIdEjercicio();
    const copia: Rutina = {
      ...rutina,
      id: this.siguienteIdRutina(),
      nombre: `${rutina.nombre} (copia)`,
      ejercicios: rutina.ejercicios.map((e) => ({ ...e, id: idEjercicio++ })),
    };
    this._rutinas.set([...this._rutinas(), copia]);
    this.subir(copia.id);
    return copia;
  }

  eliminar(id: number) {
    this._rutinas.set(this._rutinas().filter((r) => r.id !== id));
    const usuarioId = this.usuarioId;
    if (usuarioId) {
      this.supabase.guardar(() =>
        this.supabase.client.from('rutinas').delete().eq('user_id', usuarioId).eq('id', id)
      );
    }
  }

  // ------------------------------------------------------------- ejercicios

  /** Con ejercicioId null lo añade al final; si no, lo reemplaza. */
  guardarEjercicio(rutinaId: number, ejercicioId: number | null, datos: DatosEjercicio) {
    this.cambiarEjercicios(rutinaId, (ejercicios) =>
      ejercicioId === null
        ? [...ejercicios, { id: this.siguienteIdEjercicio(), ...datos }]
        : ejercicios.map((e) => (e.id === ejercicioId ? { ...e, ...datos } : e))
    );
  }

  eliminarEjercicio(rutinaId: number, ejercicioId: number) {
    this.cambiarEjercicios(rutinaId, (ejercicios) =>
      ejercicios.filter((e) => e.id !== ejercicioId)
    );
  }

  /** Recibe la lista ya reordenada (la que devuelve ion-reorder-group). */
  reordenarEjercicios(rutinaId: number, ejercicios: Ejercicio[]) {
    this.cambiarEjercicios(rutinaId, () => ejercicios);
  }

  // ------------------------------------------------- cuenta (DatosUsuarioService)

  async cargar(usuarioId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('rutinas')
      .select('*')
      .eq('user_id', usuarioId)
      .order('id')
      .overrideTypes<FilaRutina[], { merge: false }>();
    if (error) {
      throw error;
    }
    this.usuarioId = usuarioId;
    this._rutinas.set(data.map(aRutina));
  }

  /** Sube varias rutinas de una vez (primera vez que entra la cuenta). */
  async importar(usuarioId: string, rutinas: Rutina[]): Promise<void> {
    if (!rutinas.length) {
      return;
    }
    const { error } = await this.supabase.client
      .from('rutinas')
      .upsert(rutinas.map((r) => aFila(usuarioId, r)));
    if (error) {
      throw error;
    }
  }

  limpiar() {
    this.usuarioId = null;
    this._rutinas.set([]);
  }

  // -------------------------------------------------------------- auxiliares

  private cambiarEjercicios(rutinaId: number, cambio: (ejercicios: Ejercicio[]) => Ejercicio[]) {
    this._rutinas.set(
      this._rutinas().map((r) =>
        r.id === rutinaId ? { ...r, ejercicios: cambio(r.ejercicios) } : r
      )
    );
    this.subir(rutinaId);
  }

  /** Guarda en la cuenta la rutina tal como quedó (insert o update). */
  private subir(id: number) {
    const rutina = this.obtener(id);
    const usuarioId = this.usuarioId;
    if (rutina && usuarioId) {
      const fila = aFila(usuarioId, rutina);
      this.supabase.guardar(() => this.supabase.client.from('rutinas').upsert(fila));
    }
  }

  private siguienteIdRutina(): number {
    return Math.max(0, ...this._rutinas().map((r) => r.id)) + 1;
  }

  private siguienteIdEjercicio(): number {
    return Math.max(0, ...this._rutinas().flatMap((r) => r.ejercicios).map((e) => e.id)) + 1;
  }
}

function aRutina(fila: FilaRutina): Rutina {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    nivel: fila.nivel,
    minutos: fila.minutos,
    ejercicios: fila.ejercicios,
  };
}

function aFila(usuarioId: string, rutina: Rutina): FilaRutina {
  return {
    user_id: usuarioId,
    id: rutina.id,
    nombre: rutina.nombre,
    categoria: rutina.categoria ?? '',
    nivel: rutina.nivel ?? '',
    minutos: Math.max(0, Math.round(rutina.minutos) || 0),
    ejercicios: rutina.ejercicios ?? [],
  };
}
