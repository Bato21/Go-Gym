import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barbell, flame, walk } from 'ionicons/icons';

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

@Component({
  selector: 'app-inicio',
  templateUrl: 'inicio.page.html',
  styleUrls: ['inicio.page.scss'],
  imports: [
    RouterLink,
    IonAvatar,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonRow,
    IonText,
    IonTitle,
    IonToolbar,
  ],
})
export class InicioPage {
  usuario = { nombre: 'Vicente'};

  fecha = 'Lunes 31 de agosto';

  racha: { actual: number; record: number; dias: DiaRacha[] } = {
    actual: 12,
    record: 21,
    dias: [
      { inicial: 'L', estado: 'completado' },
      { inicial: 'M', estado: 'completado' },
      { inicial: 'X', estado: 'descanso' },
      { inicial: 'J', estado: 'completado' },
      { inicial: 'V', estado: 'completado' },
      { inicial: 'S', estado: 'descanso' },
      { inicial: 'D', estado: 'hoy' },
    ],
  };

  metricas: Metrica[] = [
    { valor: '4', etiqueta: 'Sesiones' },
    { valor: '8.240', unidad: 'kg', etiqueta: 'Volumen' },
    { valor: '3h 20', etiqueta: 'Tiempo' },
  ];

  rutinaHoy: RutinaHoy = {
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
    addIcons({ barbell, flame, walk });
  }
}
