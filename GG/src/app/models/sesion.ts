/** Una serie hecha. null = el usuario todavía no la rellenó. */
export interface Serie {
  kg: number | null;
  reps: number | null;
  /** Esfuerzo percibido (RPE): 1 = muy fácil, 10 = al fallo. */
  rpe: number | null;
}

/** Un ejercicio del catálogo dentro del entrenamiento, con sus series. */
export interface EjercicioSesion {
  id: number;
  catalogoId: string;
  nombre: string;
  grupo: string;
  imagen: string | null;
  /** MET del catálogo, para estimar la quema. Falta en sesiones antiguas. */
  met?: number;
  /** Repeticiones que pedía la rutina; se muestran como guía. Solo si vino de una rutina. */
  repsObjetivo?: number;
  series: Serie[];
}

export interface Sesion {
  id: number;
  nombre: string;
  /** Rutina de la que salió; falta en entrenamientos libres. */
  rutinaId?: number;
  /** Fechas en texto ISO (así las guarda y devuelve Supabase). */
  inicio: string;
  fin?: string;
  ejercicios: EjercicioSesion[];
}

/**
 * Claves de localStorage. El historial ya vive en la cuenta: CLAVE_HISTORIAL solo
 * sirve para importar el de antes. CLAVE_EN_CURSO lleva detrás el id de la cuenta.
 */
export const CLAVE_HISTORIAL = 'entrenamientosTerminados';
export const CLAVE_EN_CURSO = 'entrenamientoEnCurso';
