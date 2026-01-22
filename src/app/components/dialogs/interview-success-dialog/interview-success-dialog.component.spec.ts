import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewSuccessDialogComponent } from './interview-success-dialog.component';

describe('InterviewSuccessDialogComponent', () => {
  let component: InterviewSuccessDialogComponent;
  let fixture: ComponentFixture<InterviewSuccessDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewSuccessDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewSuccessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
