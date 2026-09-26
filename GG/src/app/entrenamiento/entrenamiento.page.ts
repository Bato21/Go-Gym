import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, barbell, checkmark, close, play, timerOutline, trashOutline } from 'ionicons/icons';

import { SelectorEjercicioComponent } from '../components/selector-ejercicio/selector-ejercicio.component';
import { EjercicioCatalogo } from '../models/ejercicio-catalogo';
import { CatalogoEjerciciosService } from '../services/catalogo-ejercicios.service';

/** Una serie hecha. null = el usuario todavía no la rellenó. */
interface Serie {
  kg: number | null;
  reps: number | null;
  /** Esfuerzo percibido (RPE): 1 = muy fácil, 10 = al fallo. */
  rpe: number | null;
}

/** Un ejercicio del catálogo dentro del entrenamiento, con sus series. */
interface EjercicioSesion {
  id: number;
  catalogoId: string;
  nombre: string;
  grupo: string;
  imagen: string | null;
  series: Serie[];
}

interface Sesion {
  id: number;
  nombre: string;
  /** Fechas en texto ISO para poder guardarlas en localStorage. */
  inicio: string;
  fin?: string;
  ejercicios: EjercicioSesion[];
}

const CLAVE_EN_CURSO = 'entrenamientoEnCurso';
const CLAVE_HISTORIAL = 'entrenamientosTerminados';

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

  /** El entrenamiento que se está haciendo ahora; null si no hay ninguno. */
  enCurso: Sesion | null = null;

  /** Entrenamientos ya terminados, el más reciente primero. */
  historial: Sesion[] = [];

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
  private readonly catalogo = inject(CatalogoEjerciciosService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ add, barbell, checkmark, close, play, timerOutline, trashOutline });
    this.cargar();
  }

  ngOnDestroy() {
    clearInterval(this.reloj);
  }

  // ---------------------------------------------------------------- lecturas

  /** Tiempo desde que empezó el entrenamiento en curso, ej. "12:05". */
  get cronometro(): string {
    if (!this.enCurso) {
      return '00:00';
    }
    return this.formatearDuracion(this.ahora - Date.parse(this.enCurso.inicio));
  }

  /** Solo se puede terminar si hay al menos una serie con repeticiones. */
  get puedeTerminar(): boolean {
    return !!this.enCurso?.ejercicios.some((e) => e.series.some((s) => this.serieHecha(s)));
  }

  /** Volumen = suma de kg × reps de todas las series. */
  volumen(sesion: Sesion): number {
    return sesion.ejercicios
      .flatMap((e) => e.series)
      .reduce((suma, s) => suma + (s.kg ?? 0) * (s.reps ?? 0), 0);
  }

  duracion(sesion: Sesion): string {
    const fin = sesion.fin ? Date.parse(sesion.fin) : this.ahora;
    return this.formatearDuracion(fin - Date.parse(sesion.inicio));
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
    this.enCurso = {
      id: Date.now(),
      nombre: this.nombreNuevo.trim() || 'Entrenamiento libre',
      inicio: new Date().toISOString(),
      ejercicios: [],
    };
    this.nombreNuevo = '';
    this.guardar();
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

  /** Limpia series vacías, pasa la sesión al historial y deja la vista libre. */
  terminar() {
    if (!this.enCurso) {
      return;
    }

    const ejercicios = this.enCurso.ejercicios
      .map((e) => ({ ...e, series: e.series.filter((s) => this.serieHecha(s)) }))
      .filter((e) => e.series.length > 0);

    const terminada: Sesion = { ...this.enCurso, fin: new Date().toISOString(), ejercicios };
    this.historial = [terminada, ...this.historial];
    this.enCurso = null;
    this.guardar();
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
          handler: () => {
            this.enCurso = null;
            this.guardar();
          },
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
    if (!this.enCurso) {
      return;
    }

    this.enCurso.ejercicios.push({
      id: Date.now(),
      catalogoId: elegido.id,
      nombre: elegido.nombre,
      grupo: elegido.grupo,
      imagen: elegido.imagen,
      series: [this.serieVacia()],
    });
    this.guardar();
  }

  quitarEjercicio(ejercicio: EjercicioSesion) {
    if (!this.enCurso) {
      return;
    }
    this.enCurso.ejercicios = this.enCurso.ejercicios.filter((e) => e.id !== ejercicio.id);
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
   * También avisa a Angular que repinte: la app no usa zone.js, y los cambios
   * que vienen de una alerta (Terminar, Descartar) no se verían si no.
   */
  guardar() {
    this.cdr.markForCheck();
    if (this.enCurso) {
      localStorage.setItem(CLAVE_EN_CURSO, JSON.stringify(this.enCurso));
    } else {
      localStorage.removeItem(CLAVE_EN_CURSO);
    }
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(this.historial));
  }

  private cargar() {
    const enCurso = localStorage.getItem(CLAVE_EN_CURSO);
    const historial = localStorage.getItem(CLAVE_HISTORIAL);
    this.enCurso = enCurso ? JSON.parse(enCurso) : null;
    this.historial = historial ? JSON.parse(historial) : [];
  }

  private serieHecha(serie: Serie): boolean {
    return (serie.reps ?? 0) > 0;
  }

  private serieVacia(): Serie {
    return { kg: null, reps: null, rpe: null };
  }

  /** Milisegundos → "mm:ss", o "h:mm:ss" pasada la hora. */
  private formatearDuracion(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const horas = Math.floor(total / 3600);
    const minutos = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const segundos = String(total % 60).padStart(2, '0');
    return horas ? `${horas}:${minutos}:${segundos}` : `${minutos}:${segundos}`;
  }
}
