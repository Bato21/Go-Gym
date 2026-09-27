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
  series: Serie[];
}

export interface Sesion {
  id: number;
  nombre: string;
  /** Fechas en texto ISO para poder guardarlas en localStorage. */
  inicio: string;
  fin?: string;
  ejercicios: EjercicioSesion[];
}

/** Clave de localStorage del historial. La escribe Entrenamiento y la lee Calorías. */
export const CLAVE_HISTORIAL = 'entrenamientosTerminados';
