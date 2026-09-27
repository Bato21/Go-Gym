/** Un ejercicio planificado dentro de una rutina. */
export interface Ejercicio {
  id: number;
  nombre: string;
  grupo: string;
  series: number;
  repeticiones: number;
  /** '45 kg' | 'Peso corporal' | '60 s' */
  carga: string;
  descansoSeg: number;
  /** Datos del catálogo si se eligió desde el selector. Faltan en ejercicios escritos a mano. */
  catalogoId?: string;
  imagen?: string | null;
  met?: number;
}

export interface Rutina {
  id: number;
  nombre: string;
  categoria: string;
  nivel: string;
  minutos: number;
  ejercicios: Ejercicio[];
}

/** Clave de localStorage de las rutinas de antes de las cuentas. Solo para importarlas. */
export const CLAVE_RUTINAS = 'rutinasUsuario';

/** MET para ejercicios sin dato del catálogo (fuerza moderada). */
export const MET_POR_DEFECTO = 5;

/** "45 kg" -> 45. "Peso corporal" o "60 s" no son kg: devuelve 0. */
export function cargaEnKg(carga: string): number {
  if (!/kg/i.test(carga)) {
    return 0;
  }
  const valor = parseFloat(carga.replace(',', '.'));
  return Number.isFinite(valor) ? valor : 0;
}

/** MET medio de la rutina, ponderado por series. */
export function metRutina(rutina: Rutina): number {
  const series = rutina.ejercicios.reduce((suma, e) => suma + e.series, 0);
  if (!series) {
    return MET_POR_DEFECTO;
  }
  const total = rutina.ejercicios.reduce(
    (suma, e) => suma + (e.met ?? MET_POR_DEFECTO) * e.series,
    0
  );
  return total / series;
}

/** Rutinas de ejemplo de una cuenta nueva. Enlazadas al catálogo. */
export const RUTINAS_INICIALES: Rutina[] = [
  {
    id: 1,
    nombre: 'Push A',
    categoria: 'Fuerza',
    nivel: 'Intermedio',
    minutos: 55,
    ejercicios: [
      { id: 11, nombre: 'Press de Banca con Barra', grupo: 'Pecho', series: 4, repeticiones: 8, carga: '45 kg', descansoSeg: 90, catalogoId: 'bench-press', imagen: 'bench-press-start.webp', met: 6 },
      { id: 12, nombre: 'Press con mancuernas en banco inclinado', grupo: 'Pecho', series: 3, repeticiones: 10, carga: '18 kg', descansoSeg: 90, catalogoId: 'incline-db-press', imagen: 'incline-db-press-start.webp', met: 6 },
      { id: 13, nombre: 'Elevación Lateral con Mancuernas', grupo: 'Hombro', series: 4, repeticiones: 12, carga: '8 kg', descansoSeg: 60, catalogoId: 'lateral-raise', imagen: 'lateral-raise-start.webp', met: 5 },
      { id: 14, nombre: 'Fondos para Pecho', grupo: 'Pecho', series: 3, repeticiones: 10, carga: 'Peso corporal', descansoSeg: 90, catalogoId: 'dips', imagen: 'dips-start.webp', met: 6 },
      { id: 15, nombre: 'Jalón de Tríceps en Cable', grupo: 'Tríceps', series: 4, repeticiones: 12, carga: '25 kg', descansoSeg: 60, catalogoId: 'tricep-pushdown', imagen: 'tricep-pushdown-start.webp', met: 5 },
    ],
  },
  {
    id: 2,
    nombre: 'Pull B',
    categoria: 'Fuerza',
    nivel: 'Intermedio',
    minutos: 50,
    ejercicios: [
      { id: 21, nombre: 'Dominada', grupo: 'Espalda', series: 4, repeticiones: 6, carga: 'Peso corporal', descansoSeg: 120, catalogoId: 'pull-up', imagen: 'pull-up-start.webp', met: 6 },
      { id: 22, nombre: 'Remo con Barra Inclinado', grupo: 'Espalda', series: 4, repeticiones: 10, carga: '40 kg', descansoSeg: 90, catalogoId: 'barbell-row', imagen: 'barbell-row-start.webp', met: 6 },
      { id: 23, nombre: 'Curl de Bíceps con Mancuernas', grupo: 'Bíceps', series: 3, repeticiones: 12, carga: '12 kg', descansoSeg: 60, catalogoId: 'bicep-curl', imagen: 'bicep-curl-start.webp', met: 5 },
    ],
  },
  {
    id: 3,
    nombre: 'Legs A',
    categoria: 'Fuerza',
    nivel: 'Avanzado',
    minutos: 60,
    ejercicios: [
      { id: 31, nombre: 'Sentadilla Trasera con Barra', grupo: 'Pierna', series: 5, repeticiones: 5, carga: '80 kg', descansoSeg: 150, catalogoId: 'squat', imagen: 'squat-start.webp', met: 6 },
      { id: 32, nombre: 'Peso Muerto Rumano', grupo: 'Pierna', series: 4, repeticiones: 8, carga: '60 kg', descansoSeg: 120, catalogoId: 'romanian-deadlift', imagen: 'romanian-deadlift-start.webp', met: 6 },
      { id: 33, nombre: 'Plancha', grupo: 'Core', series: 3, repeticiones: 1, carga: '60 s', descansoSeg: 45, catalogoId: 'plank', imagen: 'plank-main.webp', met: 3.5 },
    ],
  },
];
