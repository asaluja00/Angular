import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewPrecheckComponent } from './interview-precheck.component';

describe('InterviewPrecheckComponent', () => {
  let component: InterviewPrecheckComponent;
  let fixture: ComponentFixture<InterviewPrecheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewPrecheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewPrecheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
