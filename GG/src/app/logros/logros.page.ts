import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonProgressBar
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  trophyOutline,
  barbellOutline,
  flameOutline,
  fitnessOutline,
  medalOutline,
  starOutline,
  lockClosedOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-logros',
  templateUrl: './logros.page.html',
  styleUrls: ['./logros.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonProgressBar,
    CommonModule,
    FormsModule
  ]
})
export class LogrosPage implements OnInit {

  logros = [
    {
      icono: 'barbell-outline',
      titulo: 'Primer entrenamiento',
      descripcion: 'Completa tu primer entrenamiento',
      completado: true
    },
    {
      icono: 'flame-outline',
      titulo: 'En llamas',
      descripcion: 'Entrena 3 días seguidos',
      completado: true
    },
    {
      icono: 'trophy-outline',
      titulo: 'Semana perfecta',
      descripcion: 'Completa todos tus entrenamientos de la semana',
      completado: false
    },
    {
      icono: 'fitness-outline',
      titulo: 'Constancia',
      descripcion: 'Completa 10 entrenamientos',
      completado: false
    },
    {
      icono: 'medal-outline',
      titulo: 'Atleta',
      descripcion: 'Completa 25 entrenamientos',
      completado: false
    },
    {
      icono: 'star-outline',
      titulo: 'Leyenda',
      descripcion: 'Completa 100 entrenamientos',
      completado: false
    }
  ];

  constructor() {

    addIcons({
      trophyOutline,
      barbellOutline,
      flameOutline,
      fitnessOutline,
      medalOutline,
      starOutline,
      lockClosedOutline
    });

  }

  ngOnInit() {}

  get logrosCompletados() {
    return this.logros.filter(logro => logro.completado).length;
  }

  get progreso() {
    return this.logrosCompletados / this.logros.length;
  }
}