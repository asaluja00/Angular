import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadResumesComponent } from './upload-resumes.component';

describe('UploadResumesComponent', () => {
  let component: UploadResumesComponent;
  let fixture: ComponentFixture<UploadResumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadResumesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadResumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
