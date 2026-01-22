import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-card',
    imports: [
        CommonModule,
        MatCardModule,
        MatChipsModule,
        MatIconModule
    ],
    templateUrl: './card.component.html',
    styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() profiles: number = 0;
  @Input() title: string = '';
  @Input() date: Date = new Date();
  @Input() designation: string = '';
  @Input() icon: string = '';
  @Input() isClosedRequirement: boolean = false;
  @Input() closedDate: string = '';
  @Input() reqId: string = '';
  @Output() cardClicked = new EventEmitter<{ title: string, reqId: string, isClosedRequirement: boolean, profiles: number}>();

  onCardClick() {
    this.cardClicked.emit({ 
      title: this.title, 
      reqId: this.reqId, 
      isClosedRequirement: this.isClosedRequirement,
      profiles: this.profiles
    });
   
  }
}
