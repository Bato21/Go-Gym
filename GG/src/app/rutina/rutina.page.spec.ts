import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RutinaPage } from './rutina.page';

describe('RutinaPage', () => {
  let component: RutinaPage;
  let fixture: ComponentFixture<RutinaPage>;

  beforeEach(async () => {
    // RouterLink necesita el router; las miniaturas usan el servicio del catálogo (HttpClient).
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(RutinaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
