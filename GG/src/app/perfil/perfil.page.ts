import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonProgressBar,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonModal
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
  closeOutline,
  scaleOutline
} from 'ionicons/icons';

import { PERFIL_INICIAL, Perfil } from '../models/perfil';
import { Rutina } from '../models/rutina';
import { PerfilService } from '../services/perfil.service';
import { RutinasService } from '../services/rutinas.service';
import { SesionesService } from '../services/sesiones.service';
import { NOMBRES_DIAS, claveDia, indiceDia, sumarDias } from '../utils/fechas';

interface ProximoEntrenamiento {
  dia: string;
  entrenamiento: string;
  hora: string;
}

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
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    FormsModule
  ],
})

export class PerfilPage {

  private readonly perfilService = inject(PerfilService);
  private readonly rutinas = inject(RutinasService);
  private readonly sesiones = inject(SesionesService);

  /** Opciones del selector de días (el índice es el día: 0 = lunes). */
  readonly nombresDias = NOMBRES_DIAS;

  editando = false;

  // Copia que se edita; solo pasa al perfil al pulsar "Guardar cambios"
  borrador: Perfil = this.copiar(PERFIL_INICIAL);

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
      closeOutline,
      scaleOutline
    });

  }

  // Todo se lee de los servicios: lo que cambia aquí se ve en Inicio, Calorías y Logros

  get perfil(): Perfil {
    return this.perfilService.perfil();
  }

  get nombreCompleto(): string {
    return this.perfilService.nombreCompleto();
  }

  get diasRacha(): number {
    return this.sesiones.rachaActual();
  }

  get entrenamientosSemana(): number {
    return this.sesiones.deLaSemana().length;
  }

  get metaSemanal(): number {
    return this.perfilService.metaSemanal();
  }

  get progresoSemanal(): number {
    return this.metaSemanal ? Math.min(1, this.entrenamientosSemana / this.metaSemanal) : 0;
  }

  get listaRutinas(): Rutina[] {
    return this.rutinas.rutinas();
  }

  get rutinaFavorita(): string {
    return this.rutinas.obtener(this.perfil.rutinaFavoritaId)?.nombre ?? 'Sin elegir';
  }

  /** Próximos 3 días de entrenamiento, cada uno con la rutina que toca en la rotación. */
  get proximosEntrenamientos(): ProximoEntrenamiento[] {

    const hoy = new Date();

    // Si hoy ya entrenó, lo próximo empieza mañana
    const desde = this.sesiones.entrenoEl(hoy) ? sumarDias(hoy, 1) : hoy;
    const fechas = this.perfilService.proximosDias(3, desde);
    const rutinas = this.rutinas.proximas(fechas.length);

    return fechas.map((fecha, i) => ({
      dia: claveDia(fecha) === claveDia(hoy)
        ? 'Hoy'
        : `${NOMBRES_DIAS[indiceDia(fecha)]} ${fecha.getDate()}`,
      entrenamiento: rutinas[i]?.nombre ?? 'Entrenamiento libre',
      hora: this.perfil.horaEntrenamiento
    }));

  }


  editarPerfil() {

    this.borrador = this.copiar(this.perfil);

    this.editando = true;

  }


  guardarPerfil() {

    this.perfilService.actualizar({
      ...this.borrador,
      nombre: this.borrador.nombre.trim(),
      apellido: this.borrador.apellido.trim(),
      objetivo: this.borrador.objetivo.trim(),
      pesoKg: Number(this.borrador.pesoKg) > 0 ? Number(this.borrador.pesoKg) : this.perfil.pesoKg,
      diasEntrenamiento: [...this.borrador.diasEntrenamiento].sort((a, b) => a - b)
    });

    this.editando = false;

  }


  /** ion-datetime entrega un ISO completo ("2026-09-27T18:30:00"); el perfil guarda "18:30". */
  cambiarHora(valor: string | string[] | null | undefined) {

    const hora = /(\d{2}):(\d{2})/.exec(String(valor ?? ''));

    if (hora) {
      this.borrador.horaEntrenamiento = `${hora[1]}:${hora[2]}`;
    }

  }


  cancelarEdicion() {

    this.editando = false;

  }


  private copiar(perfil: Perfil): Perfil {

    return {
      ...perfil,
      diasEntrenamiento: [...perfil.diasEntrenamiento],
      metasMacros: { ...perfil.metasMacros }
    };

  }

}
