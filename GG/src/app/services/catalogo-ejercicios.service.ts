import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, retry, shareReplay, throwError } from 'rxjs';

import { EjercicioCatalogo, GrupoMuscular } from '../models/ejercicio-catalogo';

/**
 * Imágenes del dataset RepDB servidas por jsDelivr.
 * Fijado a un commit: con @main, si el repo de origen renombra o borra una
 * imagen, se rompen todas en producción sin aviso.
 */
const BASE_IMAGENES =
  'https://cdn.jsdelivr.net/gh/RepDB/exercise-dataset@6d88fc6f3a398845f7f2c17f3a5f45cfc4effa2f/images/flat/';

const RUTA_CATALOGO = 'assets/data/ejercicios.json';

@Injectable({ providedIn: 'root' })
export class CatalogoEjerciciosService {
  private http = inject(HttpClient);

  /** Se descarga una sola vez por sesión; shareReplay reparte la misma respuesta. */
  private catalogo$?: Observable<EjercicioCatalogo[]>;

  cargar(): Observable<EjercicioCatalogo[]> {
    this.catalogo$ ??= this.http.get<EjercicioCatalogo[]>(RUTA_CATALOGO).pipe(
      retry({ count: 2, delay: 1000 }),
      // shareReplay también cachea el error: sin esto, un fallo de red al
      // arrancar dejaría la app sin catálogo hasta cerrarla. Soltamos la
      // caché para que el siguiente cargar() vuelva a intentarlo.
      catchError((error) => {
        this.catalogo$ = undefined;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.catalogo$;
  }

  buscarPorId(id: string): Observable<EjercicioCatalogo | undefined> {
    return this.cargar().pipe(map((lista) => lista.find((e) => e.id === id)));
  }

  /**
   * Filtra en memoria sobre una lista ya cargada.
   * Busca por nombre y por equipo, ignorando tildes y mayúsculas:
   * "biceps" encuentra "Curl de Bíceps".
   */
  filtrar(
    ejercicios: EjercicioCatalogo[],
    texto: string,
    grupo: GrupoMuscular | 'Todos'
  ): EjercicioCatalogo[] {
    const termino = this.normalizar(texto);

    return ejercicios.filter((ejercicio) => {
      const coincideGrupo = grupo === 'Todos' || ejercicio.grupo === grupo;
      if (!coincideGrupo) {
        return false;
      }
      if (!termino) {
        return true;
      }
      return (
        this.normalizar(ejercicio.nombre).includes(termino) ||
        this.normalizar(ejercicio.equipo).includes(termino)
      );
    });
  }

  urlImagen(archivo: string | null): string {
    return archivo ? `${BASE_IMAGENES}${archivo}` : '';
  }

  private normalizar(texto: string): string {
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
