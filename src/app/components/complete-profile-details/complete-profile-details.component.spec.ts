import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteProfileDetailsComponent } from './complete-profile-details.component';

describe('CompleteProfileDetailsComponent', () => {
  let component: CompleteProfileDetailsComponent;
  let fixture: ComponentFixture<CompleteProfileDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteProfileDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompleteProfileDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
