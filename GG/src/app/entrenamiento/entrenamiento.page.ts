import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-entrenamiento',
  templateUrl: 'entrenamiento.page.html',
  styleUrls: ['entrenamiento.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent]
})
export class EntrenamientoPage {

  constructor() {}

}
