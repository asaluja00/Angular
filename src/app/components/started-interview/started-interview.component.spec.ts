import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartedInterviewComponent } from './started-interview.component';

describe('StartedInterviewComponent', () => {
  let component: StartedInterviewComponent;
  let fixture: ComponentFixture<StartedInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartedInterviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartedInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
