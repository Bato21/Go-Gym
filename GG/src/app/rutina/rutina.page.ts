import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  ItemReorderEventDetail,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  barbell,
  close,
  copyOutline,
  createOutline,
  flame,
  image,
  play,
  trashOutline,
  trophy,
} from 'ionicons/icons';

interface Ejercicio {
  id: number;
  nombre: string;
  grupo: string;
  series: number;
  repeticiones: number;
  carga: string;
  descansoSeg: number;
}

interface Rutina {
  id: number;
  nombre: string;
  categoria: string;
  nivel: string;
  minutos: number;
  ejercicios: Ejercicio[];
}

@Component({
  selector: 'app-rutina',
  templateUrl: 'rutina.page.html',
  styleUrls: ['rutina.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonChip,
    IonCol,
    IonContent,
    IonFooter,
    IonGrid,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonModal,
    IonNote,
    IonReorder,
    IonReorderGroup,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonText,
    IonThumbnail,
    IonTitle,
    IonToolbar,
  ],
})
export class RutinaPage {
  niveles = ['Principiante', 'Intermedio', 'Avanzado'];
  gruposMusculares = [
    'Pecho',
    'Espalda',
    'Hombro',
    'Bíceps',
    'Tríceps',
    'Pierna',
    'Core',
  ];

  rutinas: Rutina[] = [
    {
      id: 1,
      nombre: 'Push A',
      categoria: 'Fuerza',
      nivel: 'Intermedio',
      minutos: 55,
      ejercicios: [
        { id: 11, nombre: 'Press banca', grupo: 'Pecho', series: 4, repeticiones: 8, carga: '45 kg', descansoSeg: 90 },
        { id: 12, nombre: 'Press inclinado con mancuernas', grupo: 'Pecho', series: 3, repeticiones: 10, carga: '18 kg', descansoSeg: 90 },
        { id: 13, nombre: 'Elevaciones laterales', grupo: 'Hombro', series: 4, repeticiones: 12, carga: '8 kg', descansoSeg: 60 },
        { id: 14, nombre: 'Fondos en paralelas', grupo: 'Tríceps', series: 3, repeticiones: 10, carga: 'Peso corporal', descansoSeg: 90 },
        { id: 15, nombre: 'Extensión de tríceps en polea', grupo: 'Tríceps', series: 4, repeticiones: 12, carga: '25 kg', descansoSeg: 60 },
      ],
    },
    {
      id: 2,
      nombre: 'Pull B',
      categoria: 'Fuerza',
      nivel: 'Intermedio',
      minutos: 50,
      ejercicios: [
        { id: 21, nombre: 'Dominadas', grupo: 'Espalda', series: 4, repeticiones: 6, carga: 'Peso corporal', descansoSeg: 120 },
        { id: 22, nombre: 'Remo con barra', grupo: 'Espalda', series: 4, repeticiones: 10, carga: '40 kg', descansoSeg: 90 },
        { id: 23, nombre: 'Curl con mancuernas', grupo: 'Bíceps', series: 3, repeticiones: 12, carga: '12 kg', descansoSeg: 60 },
      ],
    },
    {
      id: 3,
      nombre: 'Legs A',
      categoria: 'Fuerza',
      nivel: 'Avanzado',
      minutos: 60,
      ejercicios: [
        { id: 31, nombre: 'Sentadilla', grupo: 'Pierna', series: 5, repeticiones: 5, carga: '80 kg', descansoSeg: 150 },
        { id: 32, nombre: 'Peso muerto rumano', grupo: 'Pierna', series: 4, repeticiones: 8, carga: '60 kg', descansoSeg: 120 },
        { id: 33, nombre: 'Plancha', grupo: 'Core', series: 3, repeticiones: 1, carga: '60 s', descansoSeg: 45 },
      ],
    },
  ];

  rutinaSeleccionadaId = 1;
  grupoActivo = 'Todos';
  modoEdicion = false;

  // --- Estado de los formularios (modales) ---
  modalRutinaAbierto = false;
  rutinaEnEdicionId: number | null = null;
  borradorRutina = this.rutinaVacia();

  modalEjercicioAbierto = false;
  ejercicioEnEdicionId: number | null = null;
  borradorEjercicio = this.ejercicioVacio();

  private readonly alertas = inject(AlertController);

  constructor() {
    addIcons({
      add,
      barbell,
      close,
      copyOutline,
      createOutline,
      flame,
      image,
      play,
      trashOutline,
      trophy,
    });
  }

  // ---------------------------------------------------------------- lecturas

  get rutinaActual(): Rutina | undefined {
    return this.rutinas.find((r) => r.id === this.rutinaSeleccionadaId);
  }

  /** "Todos" + los grupos musculares presentes en la rutina, sin repetir. */
  get grupos(): string[] {
    const ejercicios = this.rutinaActual?.ejercicios ?? [];
    return ['Todos', ...new Set(ejercicios.map((e) => e.grupo))];
  }

  get ejerciciosFiltrados(): Ejercicio[] {
    const ejercicios = this.rutinaActual?.ejercicios ?? [];
    if (this.grupoActivo === 'Todos') {
      return ejercicios;
    }
    return ejercicios.filter((e) => e.grupo === this.grupoActivo);
  }

  get totalSeries(): number {
    return (this.rutinaActual?.ejercicios ?? []).reduce(
      (suma, e) => suma + e.series,
      0
    );
  }

  /** Volumen de la rutina: series x reps x carga, ignorando lo que no va en kg. */
  get volumenEstimado(): number {
    return (this.rutinaActual?.ejercicios ?? []).reduce(
      (suma, e) => suma + e.series * e.repeticiones * this.cargaEnKg(e.carga),
      0
    );
  }

  get volumenFormateado(): string {
    return Math.round(this.volumenEstimado).toLocaleString('es-CL');
  }

  /** Ejercicios de un grupo muscular, para el contador de cada chip. */
  contarPorGrupo(grupo: string): number {
    const ejercicios = this.rutinaActual?.ejercicios ?? [];
    if (grupo === 'Todos') {
      return ejercicios.length;
    }
    return ejercicios.filter((e) => e.grupo === grupo).length;
  }

  /** Degradado de portada fijo por rutina, para distinguirlas de un vistazo. */
  get clasePortada(): string {
    return `portada portada--${this.rutinaSeleccionadaId % 3}`;
  }

  /** Solo se puede reordenar en modo edición y sobre la lista completa. */
  get puedeReordenar(): boolean {
    return this.modoEdicion && this.grupoActivo === 'Todos';
  }

  // -------------------------------------------------------- rutina: acciones

  seleccionarRutina(id: string | number | undefined) {
    this.rutinaSeleccionadaId = Number(id);
    this.grupoActivo = 'Todos';
    this.modoEdicion = false;
  }

  cambiarGrupo(grupo: string | number | undefined) {
    this.grupoActivo = String(grupo ?? 'Todos');
  }

  alternarEdicion() {
    this.modoEdicion = !this.modoEdicion;
    if (this.modoEdicion) {
      this.grupoActivo = 'Todos';
    }
  }

  nuevaRutina() {
    this.rutinaEnEdicionId = null;
    this.borradorRutina = this.rutinaVacia();
    this.modalRutinaAbierto = true;
  }

  editarRutina() {
    const rutina = this.rutinaActual;
    if (!rutina) {
      return;
    }
    this.rutinaEnEdicionId = rutina.id;
    this.borradorRutina = { ...rutina };
    this.modalRutinaAbierto = true;
  }

  guardarRutina() {
    const nombre = this.borradorRutina.nombre.trim();
    if (!nombre) {
      return;
    }

    if (this.rutinaEnEdicionId === null) {
      const nueva: Rutina = {
        id: this.siguienteId(this.rutinas.map((r) => r.id)),
        nombre,
        categoria: this.borradorRutina.categoria.trim() || 'Fuerza',
        nivel: this.borradorRutina.nivel,
        minutos: Number(this.borradorRutina.minutos) || 0,
        ejercicios: [],
      };
      this.rutinas = [...this.rutinas, nueva];
      this.rutinaSeleccionadaId = nueva.id;
      this.grupoActivo = 'Todos';
      this.modoEdicion = true;
    } else {
      this.rutinas = this.rutinas.map((r) =>
        r.id === this.rutinaEnEdicionId
          ? {
              ...r,
              nombre,
              categoria: this.borradorRutina.categoria.trim() || 'Fuerza',
              nivel: this.borradorRutina.nivel,
              minutos: Number(this.borradorRutina.minutos) || 0,
            }
          : r
      );
    }

    this.cerrarModalRutina();
  }

  duplicarRutina() {
    const rutina = this.rutinaActual;
    if (!rutina) {
      return;
    }

    let idEjercicio = this.siguienteId(
      this.rutinas.flatMap((r) => r.ejercicios).map((e) => e.id)
    );

    const copia: Rutina = {
      ...rutina,
      id: this.siguienteId(this.rutinas.map((r) => r.id)),
      nombre: `${rutina.nombre} (copia)`,
      ejercicios: rutina.ejercicios.map((e) => ({ ...e, id: idEjercicio++ })),
    };

    this.rutinas = [...this.rutinas, copia];
    this.rutinaSeleccionadaId = copia.id;
    this.grupoActivo = 'Todos';
  }

  eliminarRutina() {
    if (this.rutinas.length <= 1) {
      return;
    }
    this.rutinas = this.rutinas.filter((r) => r.id !== this.rutinaSeleccionadaId);
    this.rutinaSeleccionadaId = this.rutinas[0].id;
    this.grupoActivo = 'Todos';
    this.modoEdicion = false;
  }

  async confirmarEliminarRutina() {
    const rutina = this.rutinaActual;
    if (!rutina || this.rutinas.length <= 1) {
      return;
    }

    const alerta = await this.alertas.create({
      header: 'Borrar rutina',
      message: `Se eliminará "${rutina.nombre}" con sus ${rutina.ejercicios.length} ejercicios. No se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => this.eliminarRutina() },
      ],
    });

    await alerta.present();
  }

  cerrarModalRutina() {
    this.modalRutinaAbierto = false;
    this.rutinaEnEdicionId = null;
  }

  // ----------------------------------------------------- ejercicio: acciones

  nuevoEjercicio() {
    this.ejercicioEnEdicionId = null;
    this.borradorEjercicio = this.ejercicioVacio();
    this.modalEjercicioAbierto = true;
  }

  editarEjercicio(ejercicio: Ejercicio) {
    this.ejercicioEnEdicionId = ejercicio.id;
    this.borradorEjercicio = { ...ejercicio };
    this.modalEjercicioAbierto = true;
  }

  guardarEjercicio() {
    const rutina = this.rutinaActual;
    const nombre = this.borradorEjercicio.nombre.trim();
    if (!rutina || !nombre) {
      return;
    }

    const datos = {
      nombre,
      grupo: this.borradorEjercicio.grupo,
      series: Number(this.borradorEjercicio.series) || 1,
      repeticiones: Number(this.borradorEjercicio.repeticiones) || 1,
      carga: this.borradorEjercicio.carga.trim() || 'Peso corporal',
      descansoSeg: Number(this.borradorEjercicio.descansoSeg) || 60,
    };

    if (this.ejercicioEnEdicionId === null) {
      const nuevo: Ejercicio = {
        id: this.siguienteId(
          this.rutinas.flatMap((r) => r.ejercicios).map((e) => e.id)
        ),
        ...datos,
      };
      rutina.ejercicios = [...rutina.ejercicios, nuevo];
    } else {
      rutina.ejercicios = rutina.ejercicios.map((e) =>
        e.id === this.ejercicioEnEdicionId ? { ...e, ...datos } : e
      );
    }

    this.cerrarModalEjercicio();
  }

  eliminarEjercicio(ejercicio: Ejercicio) {
    const rutina = this.rutinaActual;
    if (!rutina) {
      return;
    }
    rutina.ejercicios = rutina.ejercicios.filter((e) => e.id !== ejercicio.id);
    if (!this.grupos.includes(this.grupoActivo)) {
      this.grupoActivo = 'Todos';
    }
  }

  async confirmarEliminarEjercicio(ejercicio: Ejercicio) {
    const alerta = await this.alertas.create({
      header: 'Quitar ejercicio',
      message: `"${ejercicio.nombre}" saldrá de esta rutina.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Quitar',
          role: 'destructive',
          handler: () => this.eliminarEjercicio(ejercicio),
        },
      ],
    });

    await alerta.present();
  }

  cerrarModalEjercicio() {
    this.modalEjercicioAbierto = false;
    this.ejercicioEnEdicionId = null;
  }

  reordenar(event: CustomEvent<ItemReorderEventDetail>) {
    const rutina = this.rutinaActual;
    if (rutina) {
      rutina.ejercicios = event.detail.complete(rutina.ejercicios);
    } else {
      event.detail.complete();
    }
  }

  // -------------------------------------------------------------- auxiliares

  /** "45 kg" -> 45. "Peso corporal" o "60 s" no suman volumen. */
  private cargaEnKg(carga: string): number {
    if (!/kg/i.test(carga)) {
      return 0;
    }
    const valor = parseFloat(carga.replace(',', '.'));
    return Number.isFinite(valor) ? valor : 0;
  }

  private siguienteId(ids: number[]): number {
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private rutinaVacia(): Rutina {
    return {
      id: 0,
      nombre: '',
      categoria: 'Fuerza',
      nivel: 'Intermedio',
      minutos: 45,
      ejercicios: [],
    };
  }

  private ejercicioVacio(): Ejercicio {
    return {
      id: 0,
      nombre: '',
      grupo: 'Pecho',
      series: 3,
      repeticiones: 10,
      carga: '',
      descansoSeg: 60,
    };
  }
}
