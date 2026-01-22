import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmProceedDialogComponent } from './confirm-proceed-dialog.component';

describe('ConfirmProceedDialogComponent', () => {
  let component: ConfirmProceedDialogComponent;
  let fixture: ComponentFixture<ConfirmProceedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmProceedDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmProceedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
