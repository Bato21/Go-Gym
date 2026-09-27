import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonAvatar,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonThumbnail,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, barbell, flame, person, play } from 'ionicons/icons';

import { Rutina } from '../models/rutina';
import { PerfilService } from '../services/perfil.service';
import { RutinasService } from '../services/rutinas.service';
import { SesionesService } from '../services/sesiones.service';
import {
  INICIALES_SEMANA,
  NOMBRES_DIAS,
  diaRelativo,
  formatearTiempo,
  indiceDia,
} from '../utils/fechas';

type EstadoDia = 'completado' | 'descanso' | 'hoy';

interface DiaRacha {
  inicial: string;
  estado: EstadoDia;
}

interface Metrica {
  valor: string;
  unidad?: string;
  etiqueta: string;
}

interface SesionReciente {
  id: number;
  nombre: string;
  dia: string;
  minutos: number;
  metrica: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: 'inicio.page.html',
  styleUrls: ['inicio.page.scss'],
  imports: [
    RouterLink,
    IonAvatar,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonProgressBar,
    IonThumbnail,
    IonToolbar,
  ],
})
export class InicioPage {
  private readonly perfil = inject(PerfilService);
  private readonly rutinas = inject(RutinasService);
  private readonly sesiones = inject(SesionesService);

  /** Se renueva al entrar a la pestaña: la vista queda en caché y el día puede cambiar. */
  private hoy = new Date();

  constructor() {
    addIcons({ add, barbell, flame, person, play });
  }

  ionViewWillEnter() {
    this.hoy = new Date();
  }

  get nombre(): string {
    return this.perfil.perfil().nombre;
  }

  get iniciales(): string {
    return this.perfil.iniciales();
  }

  /** "Lunes 31 de agosto", con la fecha real del dispositivo. */
  get fecha(): string {
    const texto = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(this.hoy);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  get saludo(): string {
    const hora = this.hoy.getHours();
    if (hora < 12) {
      return 'Buenos días';
    }
    return hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  }

  // ------------------------------------------------------------------ racha

  get racha() {
    return {
      actual: this.sesiones.rachaActual(this.hoy),
      record: this.sesiones.rachaRecord(),
    };
  }

  get metaSemanal(): number {
    return this.perfil.metaSemanal();
  }

  get sesionesSemana(): number {
    return this.sesiones.deLaSemana(this.hoy).length;
  }

  get dias(): DiaRacha[] {
    const entrenados = this.sesiones.diasDeLaSemana(this.hoy);
    return INICIALES_SEMANA.map((inicial, i) => ({
      inicial,
      estado: entrenados[i] ? 'completado' : i === indiceDia(this.hoy) ? 'hoy' : 'descanso',
    }));
  }

  /** Avance de la meta semanal, entre 0 y 1, para la barra de progreso. */
  get progresoMeta(): number {
    if (this.metaSemanal <= 0) {
      return 0;
    }
    return Math.min(1, this.sesionesSemana / this.metaSemanal);
  }

  /** Totales de la semana en curso. */
  get metricas(): Metrica[] {
    const semana = this.sesiones.deLaSemana(this.hoy);
    const volumen = semana.reduce((suma, s) => suma + this.sesiones.volumen(s), 0);
    const tiempo = semana.reduce((suma, s) => suma + this.sesiones.duracionMs(s), 0);
    return [
      { valor: String(semana.length), etiqueta: 'Sesiones' },
      { valor: Math.round(volumen).toLocaleString('es-CL'), unidad: 'kg', etiqueta: 'Volumen' },
      { valor: formatearTiempo(tiempo), etiqueta: 'Tiempo' },
    ];
  }

  // ------------------------------------------------------------ rutina de hoy

  get enCurso() {
    return this.sesiones.enCurso();
  }

  /** La que toca según la rotación de rutinas. */
  get rutinaHoy(): Rutina | undefined {
    return this.rutinas.siguiente();
  }

  /** "Toca hoy", "Hoy ya entrenaste · sigue" o el próximo día de entrenamiento. */
  get etiquetaRutinaHoy(): string {
    if (this.sesiones.entrenoEl(this.hoy)) {
      return 'Hoy ya entrenaste · Próxima';
    }
    if (this.perfil.esDiaEntrenamiento(this.hoy)) {
      return 'Toca hoy';
    }
    const proximo = this.perfil.proximosDias(1, this.hoy)[0];
    return proximo ? `Próximo entreno · ${NOMBRES_DIAS[indiceDia(proximo)]}` : 'Siguiente rutina';
  }

  // -------------------------------------------------------- últimas sesiones

  get ultimasSesiones(): SesionReciente[] {
    return this.sesiones
      .historial()
      .slice(0, 3)
      .map((s) => {
        const volumen = this.sesiones.volumen(s);
        return {
          id: s.id,
          nombre: s.nombre,
          dia: diaRelativo(new Date(s.inicio), this.hoy),
          minutos: Math.round(this.sesiones.duracionMs(s) / 60000),
          metrica: volumen
            ? `${Math.round(volumen).toLocaleString('es-CL')} kg`
            : `${this.sesiones.series(s)} series`,
        };
      });
  }
}
