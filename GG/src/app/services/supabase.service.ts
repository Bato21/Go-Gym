import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { createClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

/** Lo que devuelve cualquier consulta de supabase-js: nunca lanza, informa en error. */
type Respuesta = PromiseLike<{ error: unknown }>;

/**
 * Cliente único de Supabase para toda la app.
 * La sesión se guarda en localStorage y se renueva sola (opciones por defecto).
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly toasts = inject(ToastController);

  readonly client = createClient(environment.supabase.url, environment.supabase.publishableKey);

  private cola: Promise<void> = Promise.resolve();

  /**
   * Guarda en segundo plano. La vista ya cambió (los servicios actualizan su
   * signal antes), así que no hay que esperar a la red.
   * Las escrituras van en fila: crear una rutina y luego borrarla llegan en ese orden.
   */
  guardar(escritura: () => Respuesta): void {
    this.cola = this.cola.then(async () => {
      try {
        const { error } = await escritura();
        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Supabase: no se pudo guardar', error);
        await this.avisar('No se pudo guardar en tu cuenta. Revisa tu conexión.');
      }
    });
  }

  /** Espera a que terminen las escrituras pendientes (antes de cerrar sesión). */
  pendientes(): Promise<void> {
    return this.cola;
  }

  private async avisar(mensaje: string) {
    const toast = await this.toasts.create({ message: mensaje, duration: 3000, color: 'danger' });
    await toast.present();
  }
}
