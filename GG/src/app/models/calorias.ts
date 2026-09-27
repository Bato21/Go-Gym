export interface Comida {
  id: number;
  nombre: string;
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
}

/** Ejercicio hecho en el día. Las kcal no se guardan: se calculan con el MET. */
export interface Actividad {
  id: number;
  nombre: string;
  met: number;
  minutos: number;
}

/** Comidas y actividades de un día. La meta y el peso viven en el perfil. */
export interface RegistroDia {
  comidas: Comida[];
  actividades: Actividad[];
}

/** Clave de localStorage que usaba Calorías antes de guardar en la cuenta. */
export const CLAVE_CALORIAS = 'caloriasUsuario';
