import { Injectable, computed, inject, signal } from '@angular/core';

import { PERFIL_INICIAL, Perfil } from '../models/perfil';
import { indiceDia, sumarDias } from '../utils/fechas';
import { SupabaseService } from './supabase.service';

/** Fila de la tabla perfiles (ver supabase/migrations). */
interface FilaPerfil {
  id: string;
  nombre: string;
  apellido: string;
  objetivo: string;
  rutina_favorita_id: number | null;
  peso_kg: number;
  dias_entrenamiento: number[];
  hora_entrenamiento: string;
  meta_calorias: number;
  meta_proteina: number;
  meta_carbohidratos: number;
  meta_grasas: number;
}

/**
 * Perfil del usuario. Inicio, Perfil, Calorías y Logros leen de aquí:
 * cambiar el nombre o el peso en un sitio lo cambia en todos.
 * Se guarda en la tabla perfiles de Supabase, una fila por cuenta.
 */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly supabase = inject(SupabaseService);

  private readonly _perfil = signal<Perfil>(PERFIL_INICIAL);
  private usuarioId: string | null = null;

  readonly perfil = this._perfil.asReadonly();

  readonly nombreCompleto = computed(() =>
    `${this._perfil().nombre} ${this._perfil().apellido}`.trim()
  );

  /** "VR" para el avatar; vacío si todavía no hay nombre. */
  readonly iniciales = computed(() =>
    (this._perfil().nombre.charAt(0) + this._perfil().apellido.charAt(0)).toUpperCase()
  );

  /** Entrenamientos por semana = días de entrenamiento elegidos. */
  readonly metaSemanal = computed(() => this._perfil().diasEntrenamiento.length);

  actualizar(cambios: Partial<Perfil>) {
    this._perfil.update((perfil) => ({ ...perfil, ...cambios }));

    const id = this.usuarioId;
    if (id) {
      const fila = aFila(id, this._perfil());
      this.supabase.guardar(() =>
        this.supabase.client.from('perfiles').update(fila).eq('id', id)
      );
    }
  }

  esDiaEntrenamiento(fecha: Date): boolean {
    return this._perfil().diasEntrenamiento.includes(indiceDia(fecha));
  }

  /** Las próximas n fechas de entrenamiento, empezando en "desde" (incluido). */
  proximosDias(cantidad: number, desde = new Date()): Date[] {
    const fechas: Date[] = [];
    // Tope de vueltas por si el dato guardado trae días fuera de 0..6.
    for (let i = 0; fechas.length < cantidad && i < 7 * (cantidad + 1); i++) {
      const fecha = sumarDias(desde, i);
      if (this.esDiaEntrenamiento(fecha)) {
        fechas.push(fecha);
      }
    }
    return fechas;
  }

  // ------------------------------------------------- cuenta (DatosUsuarioService)

  /** Trae el perfil de la cuenta. false si la cuenta todavía no tiene perfil. */
  async cargar(usuarioId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('perfiles')
      .select('*')
      .eq('id', usuarioId)
      .maybeSingle<FilaPerfil>();
    if (error) {
      throw error;
    }
    this.usuarioId = usuarioId;
    if (data) {
      this._perfil.set(aPerfil(data));
    }
    return data !== null;
  }

  /** Primera vez que entra la cuenta. */
  async crear(usuarioId: string, perfil: Perfil): Promise<void> {
    const { error } = await this.supabase.client.from('perfiles').upsert(aFila(usuarioId, perfil));
    if (error) {
      throw error;
    }
    this.usuarioId = usuarioId;
    this._perfil.set(perfil);
  }

  limpiar() {
    this.usuarioId = null;
    this._perfil.set(PERFIL_INICIAL);
  }
}

function aPerfil(fila: FilaPerfil): Perfil {
  return {
    nombre: fila.nombre,
    apellido: fila.apellido,
    objetivo: fila.objetivo,
    rutinaFavoritaId: fila.rutina_favorita_id,
    pesoKg: Number(fila.peso_kg),
    diasEntrenamiento: fila.dias_entrenamiento,
    // La columna es time: llega como "18:00:00".
    horaEntrenamiento: fila.hora_entrenamiento.slice(0, 5),
    metaCalorias: fila.meta_calorias,
    metasMacros: {
      proteina: fila.meta_proteina,
      carbohidratos: fila.meta_carbohidratos,
      grasas: fila.meta_grasas,
    },
  };
}

function aFila(id: string, perfil: Perfil): FilaPerfil {
  return {
    id,
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    objetivo: perfil.objetivo,
    rutina_favorita_id: perfil.rutinaFavoritaId,
    peso_kg: perfil.pesoKg,
    dias_entrenamiento: perfil.diasEntrenamiento,
    hora_entrenamiento: perfil.horaEntrenamiento,
    meta_calorias: Math.round(perfil.metaCalorias),
    meta_proteina: Math.round(perfil.metasMacros.proteina),
    meta_carbohidratos: Math.round(perfil.metasMacros.carbohidratos),
    meta_grasas: Math.round(perfil.metasMacros.grasas),
  };
}
