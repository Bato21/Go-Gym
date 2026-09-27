import { TestBed } from '@angular/core/testing';

import { RUTINAS_INICIALES } from '../models/rutina';
import { Sesion } from '../models/sesion';
import { RutinasService } from './rutinas.service';
import { SesionesService } from './sesiones.service';
import { SupabaseService } from './supabase.service';

/** Sesión terminada el día indicado (año, mes 1-12, día), con una serie de 10 × 50 kg. */
function sesion(id: number, anio: number, mes: number, dia: number, rutinaId?: number): Sesion {
  const inicio = new Date(anio, mes - 1, dia, 18, 0);
  return {
    id,
    nombre: `Sesión ${id}`,
    rutinaId,
    inicio: inicio.toISOString(),
    fin: new Date(inicio.getTime() + 45 * 60000).toISOString(),
    ejercicios: [
      { id, catalogoId: '', nombre: 'Press', grupo: 'Pecho', imagen: null, series: [{ kg: 50, reps: 10, rpe: null }] },
    ],
  };
}

/** Supabase falso: cada tabla devuelve las filas dadas y las escrituras se ignoran. */
function supabaseFalso(tablas: Record<string, object[]>) {
  const consulta = (tabla: string) => {
    const respuesta = { data: tablas[tabla] ?? [], error: null };
    const cadena: Record<string, unknown> = {
      then: (seguir: (r: typeof respuesta) => unknown) => Promise.resolve(respuesta).then(seguir),
    };
    for (const metodo of ['select', 'eq', 'order', 'overrideTypes', 'upsert', 'delete', 'update']) {
      cadena[metodo] = () => cadena;
    }
    return cadena;
  };
  return { client: { from: consulta }, guardar: () => undefined };
}

/** Cuenta con las rutinas de ejemplo y el historial dado, ya cargada como tras entrar. */
async function conHistorial(historial: Sesion[]) {
  localStorage.clear();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: SupabaseService,
        useValue: supabaseFalso({
          rutinas: RUTINAS_INICIALES.map((r) => ({ user_id: 'u1', ...r })),
          sesiones: historial.map((s) => ({
            user_id: 'u1',
            id: s.id,
            nombre: s.nombre,
            rutina_id: s.rutinaId ?? null,
            inicio: s.inicio,
            fin: s.fin ?? null,
            ejercicios: s.ejercicios,
          })),
        }),
      },
    ],
  });
  const sesiones = TestBed.inject(SesionesService);
  const rutinas = TestBed.inject(RutinasService);
  await Promise.all([sesiones.cargar('u1'), rutinas.cargar('u1')]);
  return { sesiones, rutinas };
}

describe('SesionesService', () => {
  afterEach(() => localStorage.clear());

  it('cuenta la racha actual aunque hoy todavía no se haya entrenado', async () => {
    // Lunes 21, martes 22 y miércoles 23 de septiembre de 2026
    const { sesiones } = await conHistorial([sesion(3, 2026, 9, 23), sesion(2, 2026, 9, 22), sesion(1, 2026, 9, 21)]);
    expect(sesiones.rachaActual(new Date(2026, 8, 24, 9))).toBe(3);
    expect(sesiones.rachaActual(new Date(2026, 8, 25, 9))).toBe(0);
  });

  it('guarda el récord de días seguidos', async () => {
    const { sesiones } = await conHistorial([
      sesion(5, 2026, 9, 20),
      sesion(4, 2026, 9, 10),
      sesion(3, 2026, 9, 9),
      sesion(2, 2026, 9, 8),
      sesion(1, 2026, 8, 31),
    ]);
    expect(sesiones.rachaRecord()).toBe(3);
  });

  it('filtra la semana de lunes a domingo y calcula el volumen', async () => {
    const { sesiones } = await conHistorial([sesion(3, 2026, 9, 27), sesion(2, 2026, 9, 21), sesion(1, 2026, 9, 20)]);
    const semana = sesiones.deLaSemana(new Date(2026, 8, 24));
    expect(semana.map((s) => s.id)).toEqual([3, 2]);
    expect(sesiones.volumen(semana[0])).toBe(500);
    expect(sesiones.diasDeLaSemana(new Date(2026, 8, 24))).toEqual([true, false, false, false, false, false, true]);
  });

  it('al terminar descarta las series sin repeticiones', async () => {
    const { sesiones } = await conHistorial([]);
    const enCurso = sesiones.empezar('', RUTINAS_INICIALES[0]);
    enCurso.ejercicios[0].series[0].reps = 8;

    const terminada = sesiones.terminar();

    expect(terminada?.ejercicios.length).toBe(1);
    expect(terminada?.ejercicios[0].series.length).toBe(1);
    expect(terminada?.rutinaId).toBe(RUTINAS_INICIALES[0].id);
    expect(sesiones.enCurso()).toBeNull();
    expect(sesiones.historial().length).toBe(1);
  });

  it('la rotación sigue a la última rutina entrenada', async () => {
    const { rutinas } = await conHistorial([sesion(1, 2026, 9, 21, 1)]);
    expect(rutinas.siguiente()?.id).toBe(2);
    expect(rutinas.proximas(3).map((r) => r.id)).toEqual([2, 3, 1]);
  });
});
