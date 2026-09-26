import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  chevronBack,
  chevronForward,
  close,
  flame,
  optionsOutline,
  restaurant,
  trashOutline,
} from 'ionicons/icons';

import { SelectorEjercicioComponent } from '../components/selector-ejercicio/selector-ejercicio.component';
import { EjercicioCatalogo } from '../models/ejercicio-catalogo';

interface Comida {
  id: number;
  nombre: string;
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
}

/** Ejercicio hecho en el día. Las kcal no se guardan: se calculan con el MET. */
interface Actividad {
  id: number;
  nombre: string;
  met: number;
  minutos: number;
}

interface RegistroDia {
  comidas: Comida[];
  actividades: Actividad[];
}

/** Todo lo de esta vista se guarda en una sola clave de localStorage. */
const CLAVE_STORAGE = 'caloriasUsuario';

@Component({
  selector: 'app-calorias',
  templateUrl: './calorias.page.html',
  styleUrls: ['./calorias.page.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonModal,
    IonNote,
    IonProgressBar,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
    SelectorEjercicioComponent,
  ],
})
export class CaloriasPage {
  tiposComida = ['Desayuno', 'Almuerzo', 'Once', 'Cena', 'Snack'];

  /** Ajustables desde el botón de la barra superior. */
  meta = 2200;
  pesoKg = 75;

  /** Metas de macros en gramos, fijas por ahora (las del mockup). */
  metasMacros = { proteina: 150, carbohidratos: 260, grasas: 70 };

  /** Un registro por día, con clave "2026-09-26". */
  registros: Record<string, RegistroDia> = {};

  /** Día que se está mirando. Empieza en hoy y se mueve con las flechas. */
  fecha = new Date();

  // --- Estado de los modales ---
  modalComidaAbierto = false;
  borradorComida = this.comidaVacia();
  modalActividadAbierto = false;

  /** Largo de la circunferencia del anillo (radio 52 en el SVG). */
  readonly circunferencia = 2 * Math.PI * 52;

  private readonly alertas = inject(AlertController);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({
      add,
      chevronBack,
      chevronForward,
      close,
      flame,
      optionsOutline,
      restaurant,
      trashOutline,
    });
    this.cargar();
  }

  // ---------------------------------------------------------------- lecturas

  get dia(): RegistroDia {
    return this.registros[this.claveDia] ?? { comidas: [], actividades: [] };
  }

  get ingesta(): number {
    return this.dia.comidas.reduce((suma, c) => suma + c.kcal, 0);
  }

  get quema(): number {
    return this.dia.actividades.reduce(
      (suma, a) => suma + this.kcalActividad(a),
      0
    );
  }

  /** Lo que queda para llegar a la meta. El ejercicio "devuelve" calorías. */
  get restantes(): number {
    return this.meta - this.ingesta + this.quema;
  }

  /** Cuánto del anillo se pinta: calorías netas sobre la meta, entre 0 y 1. */
  get progreso(): number {
    const netas = this.ingesta - this.quema;
    return Math.min(Math.max(netas / this.meta, 0), 1);
  }

  get desplazamientoAnillo(): number {
    return this.circunferencia * (1 - this.progreso);
  }

  get macros() {
    const comidas = this.dia.comidas;
    const sumar = (campo: 'proteina' | 'carbohidratos' | 'grasas') =>
      comidas.reduce((suma, c) => suma + c[campo], 0);

    return [
      { nombre: 'Proteína', actual: sumar('proteina'), meta: this.metasMacros.proteina },
      { nombre: 'Carbohidratos', actual: sumar('carbohidratos'), meta: this.metasMacros.carbohidratos },
      { nombre: 'Grasas', actual: sumar('grasas'), meta: this.metasMacros.grasas },
    ];
  }

  get esHoy(): boolean {
    return this.claveDia === this.clave(new Date());
  }

  /** "Hoy · 26 sept", "Ayer · 25 sept" o "Miércoles · 24 sept". */
  get tituloFecha(): string {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    let nombre: string;
    if (this.esHoy) {
      nombre = 'Hoy';
    } else if (this.claveDia === this.clave(ayer)) {
      nombre = 'Ayer';
    } else {
      nombre = this.fecha.toLocaleDateString('es-CL', { weekday: 'long' });
      nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }

    const diaMes = this.fecha.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
    });
    return `${nombre} · ${diaMes}`;
  }

  /**
   * Calorías quemadas en una actividad: MET × peso (kg) × horas.
   * Es una estimación, no un dato exacto (ver riesgos en la propuesta).
   */
  kcalActividad(actividad: Actividad): number {
    return Math.round(actividad.met * this.pesoKg * (actividad.minutos / 60));
  }

  formatear(kcal: number): string {
    return Math.round(kcal).toLocaleString('es-CL');
  }

  // ---------------------------------------------------------------- acciones

  cambiarDia(dias: number) {
    const nueva = new Date(this.fecha);
    nueva.setDate(nueva.getDate() + dias);
    this.fecha = nueva;
  }

  nuevaComida() {
    this.borradorComida = this.comidaVacia();
    this.modalComidaAbierto = true;
  }

  guardarComida() {
    const kcal = Number(this.borradorComida.kcal) || 0;
    if (kcal <= 0) {
      return;
    }

    const registro = this.registroEditable();
    registro.comidas = [
      ...registro.comidas,
      {
        id: Date.now(),
        nombre: this.borradorComida.nombre,
        kcal,
        proteina: Number(this.borradorComida.proteina) || 0,
        carbohidratos: Number(this.borradorComida.carbohidratos) || 0,
        grasas: Number(this.borradorComida.grasas) || 0,
      },
    ];

    this.guardar();
    this.cerrarModalComida();
  }

  eliminarComida(comida: Comida) {
    const registro = this.registroEditable();
    registro.comidas = registro.comidas.filter((c) => c.id !== comida.id);
    this.guardar();
  }

  cerrarModalComida() {
    this.modalComidaAbierto = false;
  }

  /** Abre el mismo selector de ejercicios que usa Rutina. */
  nuevaActividad() {
    this.modalActividadAbierto = true;
  }

  /** El selector emitió un ejercicio: solo falta preguntar cuántos minutos. */
  async elegirActividad(ejercicio: EjercicioCatalogo) {
    this.modalActividadAbierto = false;

    const alerta = await this.alertas.create({
      header: ejercicio.nombre,
      message: `MET ${ejercicio.met}. ¿Cuántos minutos lo hiciste?`,
      inputs: [{ name: 'minutos', type: 'number', value: 30, min: 1 }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Añadir',
          handler: (datos: { minutos: string }) => {
            const minutos = Number(datos.minutos);
            if (!minutos || minutos <= 0) {
              return false; // deja la alerta abierta
            }
            this.agregarActividad(ejercicio, minutos);
            return true;
          },
        },
      ],
    });

    await alerta.present();
  }

  eliminarActividad(actividad: Actividad) {
    const registro = this.registroEditable();
    registro.actividades = registro.actividades.filter(
      (a) => a.id !== actividad.id
    );
    this.guardar();
  }

  cerrarModalActividad() {
    this.modalActividadAbierto = false;
  }

  async ajustar() {
    const alerta = await this.alertas.create({
      header: 'Ajustes',
      inputs: [
        { name: 'meta', type: 'number', label: 'Meta diaria (kcal)', placeholder: 'Meta diaria (kcal)', value: this.meta },
        { name: 'peso', type: 'number', label: 'Tu peso (kg)', placeholder: 'Tu peso (kg)', value: this.pesoKg },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (datos: { meta: string; peso: string }) => {
            const meta = Number(datos.meta);
            const peso = Number(datos.peso);
            if (meta <= 0 || peso <= 0) {
              return false;
            }
            this.meta = meta;
            this.pesoKg = peso;
            this.guardar();
            return true;
          },
        },
      ],
    });

    await alerta.present();
  }

  // -------------------------------------------------------------- auxiliares

  private agregarActividad(ejercicio: EjercicioCatalogo, minutos: number) {
    const registro = this.registroEditable();
    registro.actividades = [
      ...registro.actividades,
      { id: Date.now(), nombre: ejercicio.nombre, met: ejercicio.met, minutos },
    ];
    this.guardar();
  }

  private get claveDia(): string {
    return this.clave(this.fecha);
  }

  /** Fecha local en formato "AAAA-MM-DD" (toISOString usaría UTC y cambiaría de día de noche). */
  private clave(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  /** El registro del día mostrado; lo crea si ese día todavía no tenía nada. */
  private registroEditable(): RegistroDia {
    this.registros[this.claveDia] ??= { comidas: [], actividades: [] };
    return this.registros[this.claveDia];
  }

  /** Guarda y repinta: la app no usa zone.js, y los cambios desde alertas no se verían. */
  private guardar() {
    this.cdr.markForCheck();
    const datos = { meta: this.meta, pesoKg: this.pesoKg, registros: this.registros };
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));
  }

  private cargar() {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) {
      return;
    }
    const datos = JSON.parse(guardado);
    this.meta = datos.meta ?? this.meta;
    this.pesoKg = datos.pesoKg ?? this.pesoKg;
    this.registros = datos.registros ?? {};
  }

  private comidaVacia(): Omit<Comida, 'id'> {
    return {
      nombre: 'Desayuno',
      kcal: 0,
      proteina: 0,
      carbohidratos: 0,
      grasas: 0,
    };
  }
}
