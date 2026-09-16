import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectorEjercicioComponent } from './selector-ejercicio.component';

describe('SelectorEjercicioComponent', () => {
  let component: SelectorEjercicioComponent;
  let fixture: ComponentFixture<SelectorEjercicioComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectorEjercicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
