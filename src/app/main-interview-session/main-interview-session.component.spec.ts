import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainInterviewSessionComponent } from './main-interview-session.component';

describe('MainInterviewSessionComponent', () => {
  let component: MainInterviewSessionComponent;
  let fixture: ComponentFixture<MainInterviewSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainInterviewSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainInterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
