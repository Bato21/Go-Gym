/**
 * Modelo del catálogo de ejercicios (src/assets/data/ejercicios.json).
 * Datos: RepDB — https://repdb.co
 */

export type GrupoMuscular =
  | 'Pecho'
  | 'Espalda'
  | 'Hombro'
  | 'Bíceps'
  | 'Tríceps'
  | 'Pierna'
  | 'Core'
  | 'Antebrazo'
  | 'Cuerpo completo';

export type Nivel = 'Principiante' | 'Intermedio' | 'Avanzado';

export interface EjercicioCatalogo {
  /** Slug estable, ej. "barbell-bench-press". Es la clave que guardamos en la rutina. */
  id: string;
  nombre: string;
  descripcion: string;
  grupo: GrupoMuscular;
  /** Fuerza | Cardio | Estiramiento | Pliometría | Halterofilia */
  categoria: string;
  nivel: Nivel;
  /** Ya viene en español, ej. "Mancuernas", "Sin equipo". */
  equipo: string;
  pesoCorporal: boolean;
  musculos: string[];
  musculosSecundarios: string[];
  /** Equivalente metabólico, para el cálculo de calorías (MET × peso × horas). */
  met: number;
  /**
   * Nombre del archivo, no la URL. La URL se arma en CatalogoEjerciciosService.
   * null si el ejercicio no trae imagen en el dataset de origen.
   */
  imagen: string | null;
  imagenFinal: string | null;
  instrucciones: string[];
  consejos: string[];
}

/** Orden en que se muestran los filtros. Reemplaza al array local de rutina.page.ts. */
export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  'Pecho',
  'Espalda',
  'Hombro',
  'Bíceps',
  'Tríceps',
  'Pierna',
  'Core',
  'Antebrazo',
  'Cuerpo completo',
];
