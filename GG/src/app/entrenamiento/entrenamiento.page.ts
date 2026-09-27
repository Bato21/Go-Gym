import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, barbell, checkmark, close, play, timerOutline, trashOutline } from 'ionicons/icons';

import { SelectorEjercicioComponent } from '../components/selector-ejercicio/selector-ejercicio.component';
import { EjercicioCatalogo } from '../models/ejercicio-catalogo';
import { Rutina } from '../models/rutina';
import { EjercicioSesion, Serie, Sesion } from '../models/sesion';
import { CatalogoEjerciciosService } from '../services/catalogo-ejercicios.service';
import { RutinasService } from '../services/rutinas.service';
import { SesionesService } from '../services/sesiones.service';
import { formatearCronometro } from '../utils/fechas';

@Component({
  selector: 'app-entrenamiento',
  templateUrl: 'entrenamiento.page.html',
  styleUrls: ['entrenamiento.page.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonModal,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonText,
    IonThumbnail,
    IonTitle,
    IonToolbar,
    SelectorEjercicioComponent,
  ],
})
export class EntrenamientoPage implements OnDestroy {
  /** Opciones del selector de esfuerzo. */
  readonly escalaRpe = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  /** Nombre que se escribe antes de empezar. */
  nombreNuevo = '';

  modalCatalogoAbierto = false;

  /** Se actualiza cada segundo para que avance el cronómetro. */
  ahora = Date.now();
  private readonly reloj = setInterval(() => {
    this.ahora = Date.now();
    this.cdr.markForCheck();
  }, 1000);

  private readonly alertas = inject(AlertController);
  private readonly avisos = inject(ToastController);
  private readonly catalogo = inject(CatalogoEjerciciosService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rutinasService = inject(RutinasService);
  private readonly sesiones = inject(SesionesService);

  constructor() {
    addIcons({ add, barbell, checkmark, close, play, timerOutline, trashOutline });

    // "Empezar" en Rutina o Inicio llega aquí con ?rutinaId=…
    this.ruta.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('rutinaId');
      if (id !== null) {
        this.empezarDesdeEnlace(Number(id));
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.reloj);
  }

  // ---------------------------------------------------------------- lecturas

  /** El entrenamiento que se está haciendo ahora; null si no hay ninguno. */
  get enCurso(): Sesion | null {
    return this.sesiones.enCurso();
  }

  /** Entrenamientos ya terminados, el más reciente primero. */
  get historial(): Sesion[] {
    return this.sesiones.historial();
  }

  /** Rutinas con ejercicios, para empezar desde ellas. */
  get rutinas(): Rutina[] {
    return this.rutinasService.disponibles();
  }

  /** La que toca según la rotación, para marcarla en la lista. */
  get siguienteRutina(): Rutina | undefined {
    return this.rutinasService.siguiente();
  }

  /** Tiempo desde que empezó el entrenamiento en curso, ej. "12:05". */
  get cronometro(): string {
    if (!this.enCurso) {
      return '00:00';
    }
    return formatearCronometro(this.sesiones.duracionMs(this.enCurso, this.ahora));
  }

  /** Solo se puede terminar si hay al menos una serie con repeticiones. */
  get puedeTerminar(): boolean {
    return !!this.enCurso?.ejercicios.some((e) =>
      e.series.some((s) => this.sesiones.serieHecha(s))
    );
  }

  volumen(sesion: Sesion): number {
    return this.sesiones.volumen(sesion);
  }

  duracion(sesion: Sesion): string {
    return formatearCronometro(this.sesiones.duracionMs(sesion, this.ahora));
  }

  fecha(sesion: Sesion): string {
    return new Date(sesion.inicio).toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  urlImagen(ejercicio: EjercicioSesion): string {
    return this.catalogo.urlImagen(ejercicio.imagen);
  }

  // ------------------------------------------------------ entrenamiento: flujo

  empezar() {
    this.sesiones.empezar(this.nombreNuevo);
    this.nombreNuevo = '';
  }

  /** Empieza desde una rutina; si ya hay otro entrenamiento en curso, pregunta antes. */
  async empezarRutina(rutina: Rutina) {
    const actual = this.enCurso;
    if (!actual) {
      this.sesiones.empezar('', rutina);
      return;
    }
    if (actual.rutinaId === rutina.id) {
      return; // es el mismo: se retoma donde estaba
    }

    const alerta = await this.alertas.create({
      header: 'Ya tienes un entrenamiento en curso',
      message: `¿Descartar "${actual.nombre}" y empezar "${rutina.nombre}"?`,
      buttons: [
        { text: `Seguir con ${actual.nombre}`, role: 'cancel' },
        {
          text: 'Descartar y empezar',
          role: 'destructive',
          handler: () => {
            this.sesiones.empezar('', rutina);
          },
        },
      ],
    });
    await alerta.present();
  }

  async confirmarTerminar() {
    const alerta = await this.alertas.create({
      header: 'Terminar entrenamiento',
      message: 'Las series sin repeticiones no se guardarán.',
      buttons: [
        { text: 'Seguir entrenando', role: 'cancel' },
        { text: 'Terminar', handler: () => this.terminar() },
      ],
    });
    await alerta.present();
  }

  /** Limpia series vacías, pasa la sesión al historial y muestra un resumen. */
  async terminar() {
    const terminada = this.sesiones.terminar();
    if (!terminada) {
      return;
    }

    const aviso = await this.avisos.create({
      message:
        `¡Buen trabajo! ${this.duracion(terminada)} · ${this.sesiones.series(terminada)} series · ` +
        `${this.volumen(terminada).toLocaleString('es-CL')} kg`,
      duration: 3000,
      position: 'top',
      color: 'primary',
    });
    await aviso.present();
  }

  async confirmarDescartar() {
    const alerta = await this.alertas.create({
      header: 'Descartar entrenamiento',
      message: 'Se perderá todo lo registrado en esta sesión.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Descartar',
          role: 'destructive',
          handler: () => this.sesiones.descartar(),
        },
      ],
    });
    await alerta.present();
  }

  // --------------------------------------------------- ejercicios y series

  abrirCatalogo() {
    this.modalCatalogoAbierto = true;
  }

  cerrarCatalogo() {
    this.modalCatalogoAbierto = false;
  }

  /** El selector emitió un ejercicio: se agrega con una serie vacía lista para rellenar. */
  agregarEjercicio(elegido: EjercicioCatalogo) {
    this.modalCatalogoAbierto = false;
    const sesion = this.enCurso;
    if (!sesion) {
      return;
    }

    sesion.ejercicios.push({
      id: Date.now(),
      catalogoId: elegido.id,
      nombre: elegido.nombre,
      grupo: elegido.grupo,
      imagen: elegido.imagen,
      met: elegido.met,
      series: [this.serieVacia()],
    });
    this.guardar();
  }

  quitarEjercicio(ejercicio: EjercicioSesion) {
    const sesion = this.enCurso;
    if (!sesion) {
      return;
    }
    sesion.ejercicios = sesion.ejercicios.filter((e) => e.id !== ejercicio.id);
    this.guardar();
  }

  /** La serie nueva copia los valores de la anterior: casi siempre se repite el peso. */
  agregarSerie(ejercicio: EjercicioSesion) {
    const anterior = ejercicio.series.at(-1);
    ejercicio.series.push(anterior ? { ...anterior } : this.serieVacia());
    this.guardar();
  }

  quitarSerie(ejercicio: EjercicioSesion, indice: number) {
    ejercicio.series.splice(indice, 1);
    this.guardar();
  }

  // -------------------------------------------------------------- auxiliares

  /**
   * Se llama tras cada cambio, así no se pierde nada si se recarga la app.
   * También avisa a Angular que repinte: la app no usa zone.js.
   */
  guardar() {
    this.cdr.markForCheck();
    this.sesiones.guardarEnCurso();
  }

  /** Atiende ?rutinaId y lo quita de la URL, para no volver a empezarla al regresar a la pestaña. */
  private empezarDesdeEnlace(id: number) {
    const rutina = this.rutinasService.obtener(id);
    if (rutina?.ejercicios.length) {
      this.empezarRutina(rutina);
    }
    this.router.navigate([], { relativeTo: this.ruta, queryParams: {}, replaceUrl: true });
  }

  private serieVacia(): Serie {
    return { kg: null, reps: null, rpe: null };
  }
}
