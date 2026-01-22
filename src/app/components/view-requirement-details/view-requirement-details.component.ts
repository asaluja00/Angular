import { Component, inject, Input, OnInit, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { AiService } from '../services/ai.service';
import { ActivatedRoute } from '@angular/router';
import { MatIcon } from '@angular/material/icon';


@Component({
    selector: 'app-view-requirement-details',
    imports: [CommonModule, MatChipsModule, MatIcon,
  
    ],
    templateUrl: './view-requirement-details.component.html',
    styleUrl: './view-requirement-details.component.scss'
})
export class ViewRequirementDetailsComponent implements OnInit{
  public requirementDetails: any = {};
  @Input() requirementId: string = '';

  private aiservice = inject(AiService);
  private route = inject(ActivatedRoute);

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any,
    @Optional() public dialogRef?: MatDialogRef<ViewRequirementDetailsComponent>
  ) {
    // Prefer dialog data if available
    if (dialogData && dialogData.requirementId) {
      this.requirementId = dialogData.requirementId;
    }
    // If not, @Input will be used (set by parent)
    // If neither, fallback to route params in ngOnInit
  }

  ngOnInit() {
    // Use dialog data or @Input if available
    if (this.requirementId) {
      console.log('API call using dialog/input/@Input requirementId:', this.requirementId);
      this.aiservice?.getRequirementDetails({ req_id: this.requirementId }).subscribe(
        (data: any) => { 
          this.requirementDetails = data;
          console.log('Requirement Details:', data);
        }
      );
    } else {
      // Fallback to route params only if requirementId is still not set
      this.route?.params.subscribe(params => {
        this.requirementId = params['reqId'];
        console.log('API call using route param requirementId:', this.requirementId);
        if (this.requirementId) {
          this.aiservice?.getRequirementDetails({ req_id: this.requirementId }).subscribe(
            (data: any) => { 
              this.requirementDetails = data;
              console.log('Requirement Details:', data);
              console.log("titleeeeeee", this.requirementDetails.requirement_title);
            }
          );
        }
      });
    }
  }

  onCloseClick() {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      // this.closeDrawer?.emit();
    }
  }
}
