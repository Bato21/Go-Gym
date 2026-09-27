/**
 * Utilidades de fecha compartidas por todas las vistas.
 * Todas trabajan con la hora local del dispositivo: toISOString() usa UTC
 * y de noche cambiaría de día.
 */

/** Iniciales de lunes a domingo, en el orden que usa la app. */
export const INICIALES_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Nombres de lunes a domingo, para selectores y textos. */
export const NOMBRES_DIAS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

/** Fecha local en formato "AAAA-MM-DD". Sirve de clave para agrupar por día. */
export function claveDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Índice del día con la semana empezando en lunes (0 = lunes … 6 = domingo). */
export function indiceDia(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}

/** Copia de la fecha movida n días (n puede ser negativo), a medianoche. */
export function sumarDias(fecha: Date, dias: number): Date {
  const nueva = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  nueva.setDate(nueva.getDate() + dias);
  return nueva;
}

/** Lunes a medianoche de la semana de la fecha. */
export function inicioSemana(fecha: Date): Date {
  return sumarDias(fecha, -indiceDia(fecha));
}

/** Primera letra en mayúscula: Intl devuelve "lunes", la app muestra "Lunes". */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Hoy", "Ayer", el día de la semana si fue hace menos de 7 días, o "12 sept". */
export function diaRelativo(fecha: Date, hoy = new Date()): string {
  const dias = Math.round(
    (sumarDias(hoy, 0).getTime() - sumarDias(fecha, 0).getTime()) / 86_400_000
  );
  if (dias === 0) {
    return 'Hoy';
  }
  if (dias === 1) {
    return 'Ayer';
  }
  if (dias > 1 && dias < 7) {
    return capitalizar(fecha.toLocaleDateString('es-CL', { weekday: 'long' }));
  }
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/** Milisegundos → "mm:ss", o "h:mm:ss" pasada la hora. Para cronómetros. */
export function formatearCronometro(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const horas = Math.floor(total / 3600);
  const minutos = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const segundos = String(total % 60).padStart(2, '0');
  return horas ? `${horas}:${minutos}:${segundos}` : `${minutos}:${segundos}`;
}

/** Milisegundos → "45 min" o "3h 20". Para totales de tiempo. */
export function formatearTiempo(ms: number): string {
  const minutos = Math.round(Math.max(0, ms) / 60000);
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h ${String(resto).padStart(2, '0')}` : `${horas}h`;
}
