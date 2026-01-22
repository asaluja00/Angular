import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Candidate {
  initials: string;
  name: string;
  position: string;
}

@Component({
  selector: 'app-view-complete-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-complete-details.component.html',
  styleUrl: './view-complete-details.component.scss'
})
export class ViewCompleteDetailsComponent {
  @Input() candidate: Candidate | null = null;
}
