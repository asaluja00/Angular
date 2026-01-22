import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRequirementsJobDetailsComponent } from './add-requirements-job-details.component';

describe('AddRequirementsJobDetailsComponent', () => {
  let component: AddRequirementsJobDetailsComponent;
  let fixture: ComponentFixture<AddRequirementsJobDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRequirementsJobDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRequirementsJobDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
