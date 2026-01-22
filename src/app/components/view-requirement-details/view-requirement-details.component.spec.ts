import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRequirementDetailsComponent } from './view-requirement-details.component';

describe('ViewRequirementDetailsComponent', () => {
  let component: ViewRequirementDetailsComponent;
  let fixture: ComponentFixture<ViewRequirementDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRequirementDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewRequirementDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
