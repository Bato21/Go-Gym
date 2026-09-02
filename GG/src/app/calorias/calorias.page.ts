import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-calorias',
  templateUrl: './calorias.page.html',
  styleUrls: ['./calorias.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CaloriasPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
