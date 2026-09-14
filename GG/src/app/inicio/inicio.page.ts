import { Component } from '@angular/core';
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
import { barbell, flame, play, walk } from 'ionicons/icons';

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

interface RutinaHoy {
  id: number;
  nombre: string;
  ejercicios: number;
  minutos: number;
  nivel: string;
}

interface Sesion {
  nombre: string;
  dia: string;
  minutos: number;
  metrica: string;
  icono: string;
}

const INICIALES_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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
  usuario = { nombre: 'Vicente', apellido: 'Rodríguez' };

  private hoy = new Date();

  racha = {
    actual: 12,
    record: 21,
    /** Entrenamientos de la semana, de lunes a domingo. */
    completados: [true, true, false, true, true, false, false],
  };

  metaSemanal = 5;
  sesionesSemana = 4;

  metricas: Metrica[] = [
    { valor: '4', etiqueta: 'Sesiones' },
    { valor: '8.240', unidad: 'kg', etiqueta: 'Volumen' },
    { valor: '3h 20', etiqueta: 'Tiempo' },
  ];

  rutinaHoy: RutinaHoy = {
    id: 1,
    nombre: 'Push A · Pecho y tríceps',
    ejercicios: 6,
    minutos: 55,
    nivel: 'Intermedio',
  };

  ultimasSesiones: Sesion[] = [
    {
      nombre: 'Pull B · Espalda',
      dia: 'Viernes',
      minutos: 52,
      metrica: '2.310 kg',
      icono: 'barbell',
    },
    {
      nombre: 'Cardio · Cinta',
      dia: 'Jueves',
      minutos: 28,
      metrica: '310 kcal',
      icono: 'walk',
    },
    {
      nombre: 'Legs A · Piernas',
      dia: 'Martes',
      minutos: 61,
      metrica: '3.120 kg',
      icono: 'barbell',
    },
  ];

  constructor() {
    addIcons({ barbell, flame, play, walk });
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

  get iniciales(): string {
    return (this.usuario.nombre.charAt(0) + this.usuario.apellido.charAt(0)).toUpperCase();
  }

  /** Índice del día de hoy con la semana empezando en lunes (0 = lunes). */
  private get indiceHoy(): number {
    return (this.hoy.getDay() + 6) % 7;
  }

  get dias(): DiaRacha[] {
    return INICIALES_SEMANA.map((inicial, i) => ({
      inicial,
      estado: this.estadoDia(i),
    }));
  }

  private estadoDia(indice: number): EstadoDia {
    if (indice === this.indiceHoy) {
      return 'hoy';
    }
    return this.racha.completados[indice] ? 'completado' : 'descanso';
  }

  /** Avance de la meta semanal, entre 0 y 1, para la barra de progreso. */
  get progresoMeta(): number {
    if (this.metaSemanal <= 0) {
      return 0;
    }
    return Math.min(1, this.sesionesSemana / this.metaSemanal);
  }
}
