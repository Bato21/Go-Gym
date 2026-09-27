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

import { SelectorEjercicioComponent } from '../components/selector-ejercicio/selector-ejercicio.component';
import { EjercicioCatalogo, GRUPOS_MUSCULARES, NIVELES } from '../models/ejercicio-catalogo';
import { Ejercicio, Rutina, cargaEnKg, metRutina } from '../models/rutina';
import { CatalogoEjerciciosService } from '../services/catalogo-ejercicios.service';
import { PerfilService } from '../services/perfil.service';
import { RutinasService } from '../services/rutinas.service';

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
    SelectorEjercicioComponent,
  ],
})
export class RutinaPage {
  readonly niveles = NIVELES;
  readonly gruposMusculares = GRUPOS_MUSCULARES;

  private readonly alertas = inject(AlertController);
  private readonly catalogo = inject(CatalogoEjerciciosService);
  private readonly perfil = inject(PerfilService);
  private readonly servicio = inject(RutinasService);

  /** Empieza mostrando la rutina favorita del perfil, o la primera. */
  rutinaSeleccionadaId =
    this.perfil.perfil().rutinaFavoritaId ?? this.servicio.rutinas()[0]?.id ?? 0;
  grupoActivo = 'Todos';
  modoEdicion = false;

  // --- Estado de los formularios (modales) ---
  modalRutinaAbierto = false;
  rutinaEnEdicionId: number | null = null;
  borradorRutina = this.rutinaVacia();

  modalEjercicioAbierto = false;
  ejercicioEnEdicionId: number | null = null;
  borradorEjercicio = this.ejercicioVacio();

  /** Selector del catálogo. Al elegir, se abre el formulario ya relleno. */
  modalCatalogoAbierto = false;
  private abrirFormularioAlCerrarCatalogo = false;

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

  get rutinas(): Rutina[] {
    return this.servicio.rutinas();
  }

  /** Si la seleccionada ya no existe (se borró), muestra la primera. */
  get rutinaActual(): Rutina | undefined {
    return this.servicio.obtener(this.rutinaSeleccionadaId) ?? this.rutinas[0];
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
      (suma, e) => suma + e.series * e.repeticiones * cargaEnKg(e.carga),
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

  /** Estimación de la sesión con el peso del perfil: MET × kg × horas. */
  get kcalEstimadas(): number {
    const rutina = this.rutinaActual;
    if (!rutina) {
      return 0;
    }
    return Math.round(metRutina(rutina) * this.perfil.perfil().pesoKg * (rutina.minutos / 60));
  }

  /** Degradado de portada fijo por rutina, para distinguirlas de un vistazo. */
  get clasePortada(): string {
    return `portada portada--${(this.rutinaActual?.id ?? 0) % 3}`;
  }

  urlImagen(ejercicio: Ejercicio): string {
    return this.catalogo.urlImagen(ejercicio.imagen ?? null);
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
    this.borradorRutina = { ...rutina, ejercicios: [] };
    this.modalRutinaAbierto = true;
  }

  guardarRutina() {
    const nombre = this.borradorRutina.nombre.trim();
    if (!nombre) {
      return;
    }

    const datos = {
      nombre,
      categoria: this.borradorRutina.categoria.trim() || 'Fuerza',
      nivel: this.borradorRutina.nivel,
      minutos: Number(this.borradorRutina.minutos) || 0,
    };

    if (this.rutinaEnEdicionId === null) {
      const nueva = this.servicio.crear(datos);
      this.rutinaSeleccionadaId = nueva.id;
      this.grupoActivo = 'Todos';
      this.modoEdicion = true;
    } else {
      this.servicio.actualizar(this.rutinaEnEdicionId, datos);
    }

    this.cerrarModalRutina();
  }

  duplicarRutina() {
    const rutina = this.rutinaActual;
    if (!rutina) {
      return;
    }

    const copia = this.servicio.duplicar(rutina.id);
    if (copia) {
      this.rutinaSeleccionadaId = copia.id;
      this.grupoActivo = 'Todos';
    }
  }

  eliminarRutina() {
    const rutina = this.rutinaActual;
    if (!rutina || this.rutinas.length <= 1) {
      return;
    }
    this.servicio.eliminar(rutina.id);
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

  /** Añadir abre el catálogo; el formulario llega después, ya relleno. */
  nuevoEjercicio() {
    this.modalCatalogoAbierto = true;
  }

  /** Para ejercicios que no están en el catálogo. */
  nuevoEjercicioManual() {
    this.ejercicioEnEdicionId = null;
    this.borradorEjercicio = this.ejercicioVacio();
    this.modalEjercicioAbierto = true;
  }

  elegirDelCatalogo(elegido: EjercicioCatalogo) {
    this.ejercicioEnEdicionId = null;
    this.borradorEjercicio = {
      ...this.ejercicioVacio(),
      nombre: elegido.nombre,
      grupo: elegido.grupo,
      carga: elegido.pesoCorporal ? 'Peso corporal' : '',
      catalogoId: elegido.id,
      imagen: elegido.imagen,
      met: elegido.met,
    };
    this.abrirFormularioAlCerrarCatalogo = true;
    this.modalCatalogoAbierto = false;
  }

  /** Se llama cuando el selector terminó de cerrarse, para no solapar los dos modales. */
  cerrarCatalogo() {
    this.modalCatalogoAbierto = false;
    if (this.abrirFormularioAlCerrarCatalogo) {
      this.abrirFormularioAlCerrarCatalogo = false;
      this.modalEjercicioAbierto = true;
    }
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

    this.servicio.guardarEjercicio(rutina.id, this.ejercicioEnEdicionId, {
      nombre,
      grupo: this.borradorEjercicio.grupo,
      series: Number(this.borradorEjercicio.series) || 1,
      repeticiones: Number(this.borradorEjercicio.repeticiones) || 1,
      carga: this.borradorEjercicio.carga.trim() || 'Peso corporal',
      descansoSeg: Number(this.borradorEjercicio.descansoSeg) || 60,
      catalogoId: this.borradorEjercicio.catalogoId,
      imagen: this.borradorEjercicio.imagen,
      met: this.borradorEjercicio.met,
    });

    this.cerrarModalEjercicio();
  }

  eliminarEjercicio(ejercicio: Ejercicio) {
    const rutina = this.rutinaActual;
    if (!rutina) {
      return;
    }
    this.servicio.eliminarEjercicio(rutina.id, ejercicio.id);
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
      this.servicio.reordenarEjercicios(rutina.id, event.detail.complete([...rutina.ejercicios]));
    } else {
      event.detail.complete();
    }
  }

  // -------------------------------------------------------------- auxiliares

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
