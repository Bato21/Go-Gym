import { Component, OnInit, inject, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  InfiniteScrollCustomEvent,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonSpinner,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, barbell, close } from 'ionicons/icons';

import {
  EjercicioCatalogo,
  GRUPOS_MUSCULARES,
  GrupoMuscular,
} from '../../models/ejercicio-catalogo';
import { CatalogoEjerciciosService } from '../../services/catalogo-ejercicios.service';

/** Cuántos ejercicios se pintan de una vez; el resto entra con scroll infinito. */
const TAMANO_PAGINA = 30;

@Component({
  selector: 'app-selector-ejercicio',
  templateUrl: './selector-ejercicio.component.html',
  styleUrls: ['./selector-ejercicio.component.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSearchbar,
    IonSpinner,
    IonThumbnail,
    IonTitle,
    IonToolbar,
  ],
})
export class SelectorEjercicioComponent implements OnInit {
  /** Ejercicio elegido por el usuario. */
  readonly seleccionar = output<EjercicioCatalogo>(); 

  /** El usuario ha cerrado el selector sin elegir un ejercicio. */
  readonly cerrar = output<void>(); 

  /** Todos los grupos musculares, más la opción "Todos". */
  readonly grupos: (GrupoMuscular | 'Todos')[] = ['Todos', ...GRUPOS_MUSCULARES]; 

  cargando = true;
  error = false;
  texto = '';
  grupoActivo: GrupoMuscular | 'Todos' = 'Todos';

  /** Resultado del filtro actual, y la porción que está realmente en el DOM. */
  resultados: EjercicioCatalogo[] = [];
  visibles: EjercicioCatalogo[] = [];

  private todos: EjercicioCatalogo[] = [];
  private readonly catalogo = inject(CatalogoEjerciciosService);

  /** Referencia al contenido para poder hacer scroll al principio de la lista. */
  private readonly contenido = viewChild(IonContent);

  constructor() {
    addIcons({ alertCircleOutline, barbell, close });
  }

  ngOnInit() {
    this.cargar();
  }

  get hayMas(): boolean {
    return this.visibles.length < this.resultados.length;
  }

  cargar() {
    this.cargando = true;
    this.error = false;

    this.catalogo.cargar().subscribe({
      next: (lista) => {
        this.todos = lista;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      },
    });
  }

  /** Hace scroll al principio de la lista. */
  private volverAlPrincipio() {
    this.contenido()?.scrollToTop(300);
  }

  buscar(valor: string | null | undefined) {
    this.volverAlPrincipio();
    this.texto = valor ?? '';
    this.aplicarFiltros();
  }

  cambiarGrupo(grupo: GrupoMuscular | 'Todos') {
    this.volverAlPrincipio();
    this.grupoActivo = grupo;
    this.aplicarFiltros();
  }

  /** Vuelve a filtrar y reinicia la paginación al principio de la lista. */
  aplicarFiltros() {
    this.resultados = this.catalogo.filtrar(
      this.todos,
      this.texto,
      this.grupoActivo
    );
    this.visibles = this.resultados.slice(0, TAMANO_PAGINA);
  }

  cargarMas(event: InfiniteScrollCustomEvent) {
    this.visibles = this.resultados.slice(
      0,
      this.visibles.length + TAMANO_PAGINA
    );
    event.target.complete();
  }

  urlImagen(ejercicio: EjercicioCatalogo): string {
    return this.catalogo.urlImagen(ejercicio.imagen);
  }

  elegir(ejercicio: EjercicioCatalogo) {
    this.seleccionar.emit(ejercicio);
  }
}