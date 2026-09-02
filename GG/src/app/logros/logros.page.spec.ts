import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogrosPage } from './logros.page';

describe('LogrosPage', () => {
  let component: LogrosPage;
  let fixture: ComponentFixture<LogrosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LogrosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
