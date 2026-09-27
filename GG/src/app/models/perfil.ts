/** Datos del usuario. Es la única fuente para nombre, peso y metas en toda la app. */
export interface Perfil {
  nombre: string;
  apellido: string;
  objetivo: string;
  /** id de una rutina de RutinasService; null si no eligió ninguna. */
  rutinaFavoritaId: number | null;
  /** Se usa para estimar calorías quemadas (MET × peso × horas). */
  pesoKg: number;
  /** Días en que entrena, 0 = lunes … 6 = domingo. Su cantidad es la meta semanal. */
  diasEntrenamiento: number[];
  /** Hora habitual, "HH:mm". */
  horaEntrenamiento: string;
  metaCalorias: number;
  metasMacros: { proteina: number; carbohidratos: number; grasas: number };
}

/** Clave de localStorage del perfil (la misma que usaba la vista Perfil). */
export const CLAVE_PERFIL = 'perfilUsuario';

/** Valores de partida: todo se puede cambiar desde Perfil o Calorías. */
export const PERFIL_INICIAL: Perfil = {
  nombre: '',
  apellido: '',
  objetivo: '',
  rutinaFavoritaId: null,
  pesoKg: 75,
  diasEntrenamiento: [0, 2, 4],
  horaEntrenamiento: '18:00',
  metaCalorias: 2200,
  metasMacros: { proteina: 150, carbohidratos: 260, grasas: 70 },
};
