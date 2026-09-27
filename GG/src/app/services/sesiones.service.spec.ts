import { TestBed } from '@angular/core/testing';

import { RUTINAS_INICIALES } from '../models/rutina';
import { Sesion } from '../models/sesion';
import { RutinasService } from './rutinas.service';
import { SesionesService } from './sesiones.service';

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

function conHistorial(historial: Sesion[]) {
  localStorage.clear();
  localStorage.setItem('entrenamientosTerminados', JSON.stringify(historial));
  TestBed.resetTestingModule();
  return { sesiones: TestBed.inject(SesionesService), rutinas: TestBed.inject(RutinasService) };
}

describe('SesionesService', () => {
  afterEach(() => localStorage.clear());

  it('cuenta la racha actual aunque hoy todavía no se haya entrenado', () => {
    // Lunes 21, martes 22 y miércoles 23 de septiembre de 2026
    const { sesiones } = conHistorial([sesion(3, 2026, 9, 23), sesion(2, 2026, 9, 22), sesion(1, 2026, 9, 21)]);
    expect(sesiones.rachaActual(new Date(2026, 8, 24, 9))).toBe(3);
    expect(sesiones.rachaActual(new Date(2026, 8, 25, 9))).toBe(0);
  });

  it('guarda el récord de días seguidos', () => {
    const { sesiones } = conHistorial([
      sesion(5, 2026, 9, 20),
      sesion(4, 2026, 9, 10),
      sesion(3, 2026, 9, 9),
      sesion(2, 2026, 9, 8),
      sesion(1, 2026, 8, 31),
    ]);
    expect(sesiones.rachaRecord()).toBe(3);
  });

  it('filtra la semana de lunes a domingo y calcula el volumen', () => {
    const { sesiones } = conHistorial([sesion(3, 2026, 9, 27), sesion(2, 2026, 9, 21), sesion(1, 2026, 9, 20)]);
    const semana = sesiones.deLaSemana(new Date(2026, 8, 24));
    expect(semana.map((s) => s.id)).toEqual([3, 2]);
    expect(sesiones.volumen(semana[0])).toBe(500);
    expect(sesiones.diasDeLaSemana(new Date(2026, 8, 24))).toEqual([true, false, false, false, false, false, true]);
  });

  it('al terminar descarta las series sin repeticiones', () => {
    const { sesiones } = conHistorial([]);
    const enCurso = sesiones.empezar('', RUTINAS_INICIALES[0]);
    enCurso.ejercicios[0].series[0].reps = 8;

    const terminada = sesiones.terminar();

    expect(terminada?.ejercicios.length).toBe(1);
    expect(terminada?.ejercicios[0].series.length).toBe(1);
    expect(terminada?.rutinaId).toBe(RUTINAS_INICIALES[0].id);
    expect(sesiones.enCurso()).toBeNull();
    expect(sesiones.historial().length).toBe(1);
  });

  it('la rotación sigue a la última rutina entrenada', () => {
    const { rutinas } = conHistorial([sesion(1, 2026, 9, 21, 1)]);
    expect(rutinas.siguiente()?.id).toBe(2);
    expect(rutinas.proximas(3).map((r) => r.id)).toEqual([2, 3, 1]);
  });
});
