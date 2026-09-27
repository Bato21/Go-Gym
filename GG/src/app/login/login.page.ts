import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barbell } from 'ionicons/icons';

import { AuthService } from '../services/auth.service';

type Modo = 'entrar' | 'registrar';

/** Mínimo de Supabase Auth por defecto. */
const LARGO_MINIMO_PASSWORD = 6;

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonInputPasswordToggle,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonText,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  // Signals: la app no usa zone.js y el estado cambia después de cada await.
  readonly modo = signal<Modo>('entrar');
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly aviso = signal('');
  /** Hay sesión, pero no se pudieron traer los datos de la cuenta. */
  readonly errorCarga = signal(false);

  email = '';
  password = '';
  nombre = '';
  apellido = '';

  constructor() {
    addIcons({ barbell });
  }

  ionViewWillEnter() {
    this.errorCarga.set(
      this.ruta.snapshot.queryParamMap.get('error') === 'carga' && !!this.auth.usuario()
    );
    this.password = '';
    this.error.set('');
  }

  cambiarModo(modo: Modo) {
    this.modo.set(modo);
    this.error.set('');
    this.aviso.set('');
  }

  async enviar() {
    if (this.cargando()) {
      return;
    }
    const email = this.email.trim();
    const problema = this.validar(email);
    if (problema) {
      this.error.set(problema);
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    this.aviso.set('');
    try {
      if (this.modo() === 'entrar') {
        await this.auth.iniciarSesion(email, this.password);
        await this.entrar();
        return;
      }

      const resultado = await this.auth.registrarse(
        email,
        this.password,
        this.nombre.trim(),
        this.apellido.trim()
      );
      if (resultado === 'con-sesion') {
        await this.entrar();
      } else {
        this.modo.set('entrar');
        this.password = '';
        this.aviso.set(`Te enviamos un correo a ${email}. Confírmalo y luego inicia sesión.`);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Algo salió mal. Inténtalo otra vez.');
    } finally {
      this.cargando.set(false);
    }
  }

  async reintentar() {
    this.errorCarga.set(false);
    await this.entrar();
  }

  async cerrarSesion() {
    await this.auth.cerrarSesion();
    this.errorCarga.set(false);
  }

  /** El guard de las pestañas carga los datos de la cuenta antes de mostrarlas. */
  private entrar() {
    return this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }

  private validar(email: string): string {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return 'Escribe un correo válido.';
    }
    if (this.password.length < LARGO_MINIMO_PASSWORD) {
      return `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`;
    }
    if (this.modo() === 'registrar' && !this.nombre.trim()) {
      return 'Escribe tu nombre.';
    }
    return '';
  }
}
