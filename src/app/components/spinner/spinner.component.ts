import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../services/spinner.service';

@Component({
    selector: 'app-spinner',
    imports: [CommonModule, MatProgressSpinnerModule],
    templateUrl: './spinner.component.html',
    styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
      @Input() diameter = 50;
  @Input() color = 'primary';
  @Input() backdrop = true;
  isLoading = false;

  constructor(private spinnerService: SpinnerService) { }

  ngOnInit() {
    this.spinnerService.spinnerState.subscribe((state: boolean) => {
      this.isLoading = state;
    });
  }

}
