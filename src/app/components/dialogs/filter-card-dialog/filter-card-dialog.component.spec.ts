import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterCardDialogComponent } from './filter-card-dialog.component';

describe('FilterCardDialogComponent', () => {
  let component: FilterCardDialogComponent;
  let fixture: ComponentFixture<FilterCardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterCardDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterCardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
