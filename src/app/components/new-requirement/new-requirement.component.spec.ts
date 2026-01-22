import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRequirementComponent } from './new-requirement.component';

describe('NewRequirementComponent', () => {
  let component: NewRequirementComponent;
  let fixture: ComponentFixture<NewRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewRequirementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
