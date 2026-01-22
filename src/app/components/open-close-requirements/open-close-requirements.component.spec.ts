import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenCloseRequirementsComponent } from './open-close-requirements.component';

describe('OpenCloseRequirementsComponent', () => {
  let component: OpenCloseRequirementsComponent;
  let fixture: ComponentFixture<OpenCloseRequirementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenCloseRequirementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenCloseRequirementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
