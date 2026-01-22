import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-error-message',
    imports: [CommonModule, MatIconModule],
    templateUrl: './error-message.component.html',
    styleUrls: ['./error-message.component.scss']
})
export class ErrorMessageComponent {
  reason: string | null = null;
  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(params => {
      this.reason = params.get('reason');
    });
  }
}
