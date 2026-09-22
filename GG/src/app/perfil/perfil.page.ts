import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonProgressBar,
  IonButton,
  IonInput
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  personCircleOutline,
  flameOutline,
  calendarOutline,
  barbellOutline,
  trophyOutline,
  fitnessOutline,
  createOutline,
  timeOutline,
  starOutline,
  saveOutline,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonProgressBar,
    IonButton,
    IonInput,
    CommonModule,
    FormsModule
  ],
})

export class PerfilPage implements OnInit {

  nombre = 'Ian';
  apellido = 'Spikin Thomas';

  diasRacha = 5;

  objetivo = 'Ganar masa muscular';
  rutinaFavorita = 'Push Pull Legs';

  entrenamientosSemana = 3;
  metaSemanal = 4;

  editando = false;

  // Copia temporal por si el usuario cancela
  perfilTemporal: any = {};

  proximosEntrenamientos = [
    {
      dia: 'Lunes 23',
      entrenamiento: 'Pecho y tríceps',
      hora: '18:00'
    },
    {
      dia: 'Miércoles 25',
      entrenamiento: 'Espalda y bíceps',
      hora: '18:30'
    },
    {
      dia: 'Viernes 27',
      entrenamiento: 'Piernas',
      hora: '17:30'
    }
  ];

  constructor() {

    addIcons({
      personCircleOutline,
      flameOutline,
      calendarOutline,
      barbellOutline,
      trophyOutline,
      fitnessOutline,
      createOutline,
      timeOutline,
      starOutline,
      saveOutline,
      closeOutline
    });

  }

  ngOnInit() {

    this.cargarPerfil();

  }

  get progresoSemanal() {
    return this.entrenamientosSemana / this.metaSemanal;
  }


  editarPerfil() {

    this.perfilTemporal = {
      nombre: this.nombre,
      apellido: this.apellido,
      objetivo: this.objetivo,
      rutinaFavorita: this.rutinaFavorita
    };

    this.editando = true;

  }


  guardarPerfil() {

    const perfil = {
      nombre: this.nombre,
      apellido: this.apellido,
      objetivo: this.objetivo,
      rutinaFavorita: this.rutinaFavorita
    };

    localStorage.setItem('perfilUsuario', JSON.stringify(perfil));

    this.editando = false;

  }


  cancelarEdicion() {

    this.nombre = this.perfilTemporal.nombre;
    this.apellido = this.perfilTemporal.apellido;
    this.objetivo = this.perfilTemporal.objetivo;
    this.rutinaFavorita = this.perfilTemporal.rutinaFavorita;

    this.editando = false;

  }


  cargarPerfil() {

    const perfilGuardado = localStorage.getItem('perfilUsuario');

    if (perfilGuardado) {

      const perfil = JSON.parse(perfilGuardado);

      this.nombre = perfil.nombre;
      this.apellido = perfil.apellido;
      this.objetivo = perfil.objetivo;
      this.rutinaFavorita = perfil.rutinaFavorita;

    }

  }

}