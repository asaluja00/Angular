import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { AiService } from '../services/ai.service';

@Component({
    selector: 'app-open-close-requirements',
    imports: [
        CommonModule,
        CardComponent
    ],
    templateUrl: './open-close-requirements.component.html',
    styleUrl: './open-close-requirements.component.scss'
})
export class OpenCloseRequirementsComponent implements OnChanges, OnInit {
  @Output() cardClicked = new EventEmitter<{ title: string, reqId: string, isClosedRequirement: boolean, profiles: number }>();
  step: number = 1; // 1 for closed, 2 for open
  formDisabled: boolean = true; // true for closed, false for open
  // constructor(private aiService: any) {}
  private aiService = inject(AiService);
  @Input() isClosedTab: boolean = false;
  @Input() requirements: any[] = [];
  
  // This will hold the currently displayed requirements
  currentRequirements: any[] = [];
  
 
  
  ngOnInit(): void {
    
  }
  ngOnChanges(changes: SimpleChanges): void {
  if (changes['requirements'] || changes['isClosedTab']) {
    this.processRequirements();
  }
}

processRequirements(): void {
  if (Array.isArray(this.requirements)) {
    // Separate open and closed requirements
    const openReqs = this.requirements.filter((req: any) => req.isOpen === true || req.isOpen === 'True');
    const closedReqs = this.requirements.filter((req: any) => req.isOpen === false || req.isOpen === 'False');

    // Sort and format as before
    openReqs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    closedReqs.sort((a: any, b: any) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime());

    closedReqs.forEach((req: any) => {
      if (req.closed_at) {
        const dateObj = new Date(req.closed_at);
        req.closedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
      }
    });

    openReqs.forEach((req: any) => {
      if (req.timestamp) {
        const dateObj = new Date(req.timestamp);
        req.openDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
      }
    });

    // Merge for display
    this.currentRequirements = [...closedReqs, ...openReqs];
  } else {
    this.currentRequirements = [];
  }
}
  
  
  // Getter for open requirements
  get openRequirements() {
    return this.currentRequirements.filter((req: any) => req.isOpen === true || req.isOpen === 'True');
  }

  // Getter for closed requirements
  get closedRequirements() {
    return this.currentRequirements.filter((req: any) => req.isOpen === false || req.isOpen === 'False');
  }

  onCardClick(card: { title: string, reqId: string, isClosedRequirement: boolean, profiles: number }) {
    // Only emit the event to parent; parent handles navigation and form state
    this.cardClicked.emit(card);
  }
}
