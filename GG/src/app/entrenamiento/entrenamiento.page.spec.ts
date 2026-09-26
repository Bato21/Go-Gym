import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntrenamientoPage } from './entrenamiento.page';

describe('EntrenamientoPage', () => {
  let component: EntrenamientoPage;
  let fixture: ComponentFixture<EntrenamientoPage>;

  beforeEach(async () => {
    // La página usa el servicio del catálogo, que depende de HttpClient.
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(EntrenamientoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
