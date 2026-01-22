import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAnalyzeProfilesComponent } from './view-analyze-profiles.component';

describe('ViewAnalyzeProfilesComponent', () => {
  let component: ViewAnalyzeProfilesComponent;
  let fixture: ComponentFixture<ViewAnalyzeProfilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAnalyzeProfilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAnalyzeProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
