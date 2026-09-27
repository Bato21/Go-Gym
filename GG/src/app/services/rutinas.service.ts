import { Injectable, computed, inject, signal } from '@angular/core';

import { CLAVE_RUTINAS, Ejercicio, RUTINAS_INICIALES, Rutina } from '../models/rutina';
import { escribir, leer } from '../utils/almacenamiento';
import { SesionesService } from './sesiones.service';

/** Datos editables de una rutina (todo menos id y ejercicios). */
export type DatosRutina = Pick<Rutina, 'nombre' | 'categoria' | 'nivel' | 'minutos'>;

/** Datos editables de un ejercicio (todo menos el id). */
export type DatosEjercicio = Omit<Ejercicio, 'id'>;

/**
 * Rutinas del usuario, guardadas en localStorage.
 * Rutina las edita; Inicio, Entrenamiento y Perfil las leen.
 * Cada cambio crea arreglos nuevos para que los signals avisen a todas las vistas.
 */
@Injectable({ providedIn: 'root' })
export class RutinasService {
  private readonly sesiones = inject(SesionesService);

  private readonly _rutinas = signal<Rutina[]>(leer(CLAVE_RUTINAS, RUTINAS_INICIALES));

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
    this.guardar([...this._rutinas(), nueva]);
    return nueva;
  }

  actualizar(id: number, datos: DatosRutina) {
    this.guardar(this._rutinas().map((r) => (r.id === id ? { ...r, ...datos } : r)));
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
    this.guardar([...this._rutinas(), copia]);
    return copia;
  }

  eliminar(id: number) {
    this.guardar(this._rutinas().filter((r) => r.id !== id));
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

  // -------------------------------------------------------------- auxiliares

  private cambiarEjercicios(rutinaId: number, cambio: (ejercicios: Ejercicio[]) => Ejercicio[]) {
    this.guardar(
      this._rutinas().map((r) =>
        r.id === rutinaId ? { ...r, ejercicios: cambio(r.ejercicios) } : r
      )
    );
  }

  private siguienteIdRutina(): number {
    return Math.max(0, ...this._rutinas().map((r) => r.id)) + 1;
  }

  private siguienteIdEjercicio(): number {
    return Math.max(0, ...this._rutinas().flatMap((r) => r.ejercicios).map((e) => e.id)) + 1;
  }

  private guardar(rutinas: Rutina[]) {
    this._rutinas.set(rutinas);
    escribir(CLAVE_RUTINAS, rutinas);
  }
}
