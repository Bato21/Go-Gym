import { Injectable, computed, signal } from '@angular/core';

import { CLAVE_PERFIL, PERFIL_INICIAL, Perfil } from '../models/perfil';
import { escribir, leer } from '../utils/almacenamiento';
import { indiceDia, sumarDias } from '../utils/fechas';

/** Clave antigua de Calorías, que guardaba su propia meta y peso. */
const CLAVE_CALORIAS = 'caloriasUsuario';

/**
 * Perfil del usuario. Inicio, Perfil, Calorías y Logros leen de aquí:
 * cambiar el nombre o el peso en un sitio lo cambia en todos.
 */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly _perfil = signal<Perfil>(this.cargar());

  readonly perfil = this._perfil.asReadonly();

  readonly nombreCompleto = computed(() =>
    `${this._perfil().nombre} ${this._perfil().apellido}`.trim()
  );

  /** "VR" para el avatar; vacío si todavía no hay nombre. */
  readonly iniciales = computed(() =>
    (this._perfil().nombre.charAt(0) + this._perfil().apellido.charAt(0)).toUpperCase()
  );

  /** Entrenamientos por semana = días de entrenamiento elegidos. */
  readonly metaSemanal = computed(() => this._perfil().diasEntrenamiento.length);

  actualizar(cambios: Partial<Perfil>) {
    this._perfil.update((perfil) => ({ ...perfil, ...cambios }));
    escribir(CLAVE_PERFIL, this._perfil());
  }

  esDiaEntrenamiento(fecha: Date): boolean {
    return this._perfil().diasEntrenamiento.includes(indiceDia(fecha));
  }

  /** Las próximas n fechas de entrenamiento, empezando en "desde" (incluido). */
  proximosDias(cantidad: number, desde = new Date()): Date[] {
    const fechas: Date[] = [];
    // Tope de vueltas por si el dato guardado trae días fuera de 0..6.
    for (let i = 0; fechas.length < cantidad && i < 7 * (cantidad + 1); i++) {
      const fecha = sumarDias(desde, i);
      if (this.esDiaEntrenamiento(fecha)) {
        fechas.push(fecha);
      }
    }
    return fechas;
  }

  /**
   * Mezcla lo guardado con los valores por defecto, así los perfiles guardados
   * por versiones anteriores siguen sirviendo. La meta y el peso que antes
   * vivían en Calorías se traen una sola vez.
   */
  private cargar(): Perfil {
    const guardado = leer<Partial<Perfil> | null>(CLAVE_PERFIL, null);
    const perfil: Perfil = { ...PERFIL_INICIAL, ...guardado };

    if (guardado?.pesoKg === undefined) {
      const calorias = leer<{ meta?: number; pesoKg?: number }>(CLAVE_CALORIAS, {});
      perfil.pesoKg = calorias.pesoKg ?? perfil.pesoKg;
      perfil.metaCalorias = calorias.meta ?? perfil.metaCalorias;
      escribir(CLAVE_PERFIL, perfil);
    }

    return perfil;
  }
}
