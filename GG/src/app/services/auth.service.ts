import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthError, User } from '@supabase/supabase-js';

import { DatosUsuarioService } from './datos-usuario.service';
import { SupabaseService } from './supabase.service';

/** Resultado de registrarse: con confirmación de correo activa, todavía no hay sesión. */
export type ResultadoRegistro = 'con-sesion' | 'confirmar-correo';

/**
 * Cuenta del usuario (email y contraseña de Supabase Auth).
 * Cada cuenta tiene sus propios datos: los carga DatosUsuarioService.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly datos = inject(DatosUsuarioService);
  private readonly router = inject(Router);

  private readonly _usuario = signal<User | null>(null);

  readonly usuario = this._usuario.asReadonly();
  readonly email = computed(() => this._usuario()?.email ?? '');

  /** Se resuelve cuando supabase-js ya recuperó (o no) la sesión guardada. Lo esperan los guards. */
  readonly listo: Promise<void>;

  constructor() {
    let marcarListo: () => void = () => undefined;
    this.listo = new Promise((resolver) => (marcarListo = resolver));

    // Aquí no se llama a nada asíncrono de Supabase: la documentación advierte
    // que puede bloquear el cliente. Solo se actualiza el estado.
    this.supabase.client.auth.onAuthStateChange((evento, sesion) => {
      this._usuario.set(sesion?.user ?? null);

      if (evento === 'INITIAL_SESSION') {
        marcarListo();
      }
      // También llega si la sesión se cierra en otra pestaña o caduca.
      if (evento === 'SIGNED_OUT') {
        this.datos.limpiar();
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    });
  }

  async iniciarSesion(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(mensajeError(error));
    }
  }

  /** nombre y apellido se usan para crear el perfil la primera vez que entra. */
  async registrarse(
    email: string,
    password: string,
    nombre: string,
    apellido: string
  ): Promise<ResultadoRegistro> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nombre, apellido },
      },
    });
    if (error) {
      throw new Error(mensajeError(error));
    }
    // Con confirmación de correo activa, Supabase no revela si el correo ya existía:
    // devuelve un usuario sin identidades en vez de un error.
    if (data.user && !data.user.identities?.length) {
      throw new Error('Ya existe una cuenta con ese correo.');
    }
    return data.session ? 'con-sesion' : 'confirmar-correo';
  }

  /** Espera a que se suban los últimos cambios; SIGNED_OUT hace el resto. */
  async cerrarSesion(): Promise<void> {
    await this.supabase.pendientes();
    const { error } = await this.supabase.client.auth.signOut();
    if (error) {
      throw new Error(mensajeError(error));
    }
  }
}

function mensajeError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed':
      return 'Confirma tu correo antes de entrar (revisa tu bandeja de entrada).';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya existe una cuenta con ese correo.';
    case 'weak_password':
      return 'La contraseña es muy débil: usa al menos 6 caracteres.';
    case 'validation_failed':
      return 'Revisa el correo y la contraseña.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Demasiados intentos. Espera unos minutos.';
    default:
      return error.message || 'No se pudo conectar. Revisa tu conexión.';
  }
}
