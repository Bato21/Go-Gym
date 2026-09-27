import { Injectable, computed, signal } from '@angular/core';

import { Rutina, cargaEnKg } from '../models/rutina';
import { CLAVE_EN_CURSO, CLAVE_HISTORIAL, Serie, Sesion } from '../models/sesion';
import { escribir, leer } from '../utils/almacenamiento';
import { claveDia, inicioSemana, sumarDias } from '../utils/fechas';

/**
 * Entrenamientos: el que está en curso y el historial de los terminados.
 * Es la única fuente para Entrenamiento, Inicio, Calorías, Logros y Perfil.
 * Usa signals: la app no usa zone.js, y así cada vista se repinta sola.
 */
@Injectable({ providedIn: 'root' })
export class SesionesService {
  private readonly _historial = signal<Sesion[]>(leer(CLAVE_HISTORIAL, []));
  private readonly _enCurso = signal<Sesion | null>(leer(CLAVE_EN_CURSO, null));

  /** Entrenamientos terminados, el más reciente primero. */
  readonly historial = this._historial.asReadonly();
  /** El entrenamiento que se está haciendo ahora; null si no hay ninguno. */
  readonly enCurso = this._enCurso.asReadonly();

  /** Días ("AAAA-MM-DD") con al menos un entrenamiento terminado. */
  private readonly diasEntrenados = computed(
    () => new Set(this._historial().map((s) => claveDia(new Date(s.inicio))))
  );

  /** La racha más larga de días seguidos entrenando. */
  readonly rachaRecord = computed(() => {
    const dias = [...this.diasEntrenados()].sort();
    let record = 0;
    let actual = 0;
    let esperado = '';
    for (const dia of dias) {
      actual = dia === esperado ? actual + 1 : 1;
      record = Math.max(record, actual);
      const [a, m, d] = dia.split('-').map(Number);
      esperado = claveDia(new Date(a, m - 1, d + 1));
    }
    return record;
  });

  /** Mayor cantidad de entrenamientos hechos en una misma semana (lunes a domingo). */
  readonly mejorSemana = computed(() => {
    const porSemana = new Map<string, number>();
    for (const sesion of this._historial()) {
      const semana = claveDia(inicioSemana(new Date(sesion.inicio)));
      porSemana.set(semana, (porSemana.get(semana) ?? 0) + 1);
    }
    return Math.max(0, ...porSemana.values());
  });

  // ------------------------------------------------------------------ flujo

  /**
   * Empieza un entrenamiento. Con rutina, copia sus ejercicios: el peso se
   * precarga y las repeticiones quedan vacías, con el objetivo como guía.
   */
  empezar(nombre: string, rutina?: Rutina): Sesion {
    const base = Date.now();
    const sesion: Sesion = {
      id: base,
      nombre: rutina?.nombre ?? (nombre.trim() || 'Entrenamiento libre'),
      rutinaId: rutina?.id,
      inicio: new Date().toISOString(),
      ejercicios: (rutina?.ejercicios ?? []).map((e, i) => ({
        id: base + i + 1,
        catalogoId: e.catalogoId ?? '',
        nombre: e.nombre,
        grupo: e.grupo,
        imagen: e.imagen ?? null,
        met: e.met,
        repsObjetivo: e.repeticiones,
        series: Array.from({ length: Math.max(1, e.series) }, () => ({
          kg: cargaEnKg(e.carga) || null,
          reps: null,
          rpe: null,
        })),
      })),
    };
    this._enCurso.set(sesion);
    this.guardar();
    return sesion;
  }

  /** La vista edita la sesión en curso en el sitio (ngModel); esto la persiste. */
  guardarEnCurso() {
    escribir(CLAVE_EN_CURSO, this._enCurso());
  }

  /** Quita las series vacías y pasa la sesión al historial. */
  terminar(): Sesion | null {
    const actual = this._enCurso();
    if (!actual) {
      return null;
    }

    const ejercicios = actual.ejercicios
      .map((e) => ({ ...e, series: e.series.filter((s) => this.serieHecha(s)) }))
      .filter((e) => e.series.length > 0);

    const terminada: Sesion = { ...actual, fin: new Date().toISOString(), ejercicios };
    this._historial.update((historial) => [terminada, ...historial]);
    this._enCurso.set(null);
    this.guardar();
    return terminada;
  }

  descartar() {
    this._enCurso.set(null);
    this.guardar();
  }

  // --------------------------------------------------------------- lecturas

  /** Una serie cuenta si tiene repeticiones. */
  serieHecha(serie: Serie): boolean {
    return (serie.reps ?? 0) > 0;
  }

  /** Volumen = suma de kg × reps de todas las series. */
  volumen(sesion: Sesion): number {
    return sesion.ejercicios
      .flatMap((e) => e.series)
      .reduce((suma, s) => suma + (s.kg ?? 0) * (s.reps ?? 0), 0);
  }

  series(sesion: Sesion): number {
    return sesion.ejercicios.reduce((suma, e) => suma + e.series.length, 0);
  }

  /** Duración en ms; si sigue en curso, hasta "ahora". */
  duracionMs(sesion: Sesion, ahora = Date.now()): number {
    const fin = sesion.fin ? Date.parse(sesion.fin) : ahora;
    return Math.max(0, fin - Date.parse(sesion.inicio));
  }

  /** Entrenamientos terminados en la semana (lunes a domingo) de la fecha. */
  deLaSemana(fecha = new Date()): Sesion[] {
    const desde = inicioSemana(fecha).getTime();
    const hasta = sumarDias(inicioSemana(fecha), 7).getTime();
    return this._historial().filter((s) => {
      const t = Date.parse(s.inicio);
      return t >= desde && t < hasta;
    });
  }

  /** Para cada día de la semana de la fecha (0 = lunes), si hubo entrenamiento. */
  diasDeLaSemana(fecha = new Date()): boolean[] {
    const lunes = inicioSemana(fecha);
    const dias = this.diasEntrenados();
    return Array.from({ length: 7 }, (_, i) => dias.has(claveDia(sumarDias(lunes, i))));
  }

  entrenoEl(fecha: Date): boolean {
    return this.diasEntrenados().has(claveDia(fecha));
  }

  /** Días seguidos entrenando. Si hoy aún no entrena, la racha de ayer sigue viva. */
  rachaActual(hoy = new Date()): number {
    let cursor = this.entrenoEl(hoy) ? hoy : sumarDias(hoy, -1);
    let racha = 0;
    while (this.entrenoEl(cursor)) {
      racha++;
      cursor = sumarDias(cursor, -1);
    }
    return racha;
  }

  // -------------------------------------------------------------- auxiliares

  private guardar() {
    escribir(CLAVE_EN_CURSO, this._enCurso());
    escribir(CLAVE_HISTORIAL, this._historial());
  }
}
