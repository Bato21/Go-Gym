import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

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

import { PerfilService } from '../services/perfil.service';
import { SesionesService } from '../services/sesiones.service';

interface Logro {
  icono: string;
  titulo: string;
  descripcion: string;
  /** Avance actual y cifra que hay que alcanzar. */
  actual: number;
  objetivo: number;
  completado: boolean;
}

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
    DecimalPipe
  ]
})
export class LogrosPage {

  private readonly perfil = inject(PerfilService);
  private readonly sesiones = inject(SesionesService);

  /** Se calculan con el historial real: se desbloquean solos al entrenar. */
  readonly logros = computed<Logro[]>(() => {
    const total = this.sesiones.historial().length;
    const meta = this.perfil.metaSemanal();

    const logros = [
      {
        icono: 'barbell-outline',
        titulo: 'Primer entrenamiento',
        descripcion: 'Completa tu primer entrenamiento',
        actual: total,
        objetivo: 1
      },
      {
        icono: 'flame-outline',
        titulo: 'En llamas',
        descripcion: 'Entrena 3 días seguidos',
        actual: this.sesiones.rachaRecord(),
        objetivo: 3
      },
      {
        icono: 'trophy-outline',
        titulo: 'Semana perfecta',
        descripcion: meta
          ? `Completa tus ${meta} entrenamientos de la semana`
          : 'Elige tus días de entrenamiento en Perfil',
        actual: this.sesiones.mejorSemana(),
        objetivo: meta
      },
      {
        icono: 'fitness-outline',
        titulo: 'Constancia',
        descripcion: 'Completa 10 entrenamientos',
        actual: total,
        objetivo: 10
      },
      {
        icono: 'medal-outline',
        titulo: 'Atleta',
        descripcion: 'Completa 25 entrenamientos',
        actual: total,
        objetivo: 25
      },
      {
        icono: 'star-outline',
        titulo: 'Leyenda',
        descripcion: 'Completa 100 entrenamientos',
        actual: total,
        objetivo: 100
      }
    ];

    return logros.map(logro => ({
      ...logro,
      actual: Math.min(logro.actual, logro.objetivo),
      completado: logro.objetivo > 0 && logro.actual >= logro.objetivo
    }));
  });

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

  get logrosCompletados() {
    return this.logros().filter(logro => logro.completado).length;
  }

  get progreso() {
    return this.logrosCompletados / this.logros().length;
  }
}
