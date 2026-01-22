import { Component, OnInit, inject } from '@angular/core';
import { BreadcrumbsComponent } from "../../components/breadcrumbs/breadcrumbs.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { OpenCloseRequirementsComponent } from '../../components/open-close-requirements/open-close-requirements.component';
import { AiService } from '../../components/services/ai.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    imports: [
        BreadcrumbsComponent,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatCardModule,
        MatTabsModule,
        RouterLink,
        OpenCloseRequirementsComponent
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  selectedTabIndex: number = 0;
  breadcrumbs: string[] = ['Requirements', 'Open Requirements'];
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private aiService = inject(AiService);
  dashboardData: any[] = [];
  id: string = '';

  ngOnInit(): void {

    this.aiService.empId$.subscribe(id=>{
      this.id=id;
    })
      this.aiService.getDashboard(this.id).subscribe({
    next: (data: any) => {
      this.dashboardData = Array.isArray(data.data) ? data.data : [];
    },
    error: (err: any) => {
      this.dashboardData = [];
    }
  });
    // Check for the tab query parameter to determine which tab to show
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'closed') {
        this.selectedTabIndex = 1; // Select the Closed Requirements tab
        this.breadcrumbs = ['Requirements', 'Closed Requirements'];
      } else {
        this.selectedTabIndex = 0; // Default to Open Requirements tab
        this.breadcrumbs = ['Requirements', 'Open Requirements'];
      }
    });
  }
  onCardClicked(event: { title: string, reqId: string, isClosedRequirement: boolean, profiles: number }) {
    const tabText = this.selectedTabIndex === 1 ? 'Closed Requirements' : 'Open Requirements';
    const title = event.title || '';
    this.breadcrumbs = ['Requirements', tabText, title];
    
    // Set formDisabled based on whether it's a closed requirement
    const formDisabled = event.isClosedRequirement ? true : false;
    
    // For closed requirements, always go to step 1
    if (event.isClosedRequirement) {
      this.router.navigate(['/new-requirement', event.reqId], {
        queryParams: { step: 1, title, tab: tabText, formDisabled }
      });
      return;
    }
    
   
    
    // Navigate to step 2 (upload resumes) if no profiles, or step 3 (view-analyze) if profiles exist
    const step = event.profiles > 0 ? 3 : 2;

    
    // this.router.navigate(['/new-requirement', event.reqId], {
    //   queryParams: { step, title, tab: tabText, formDisabled }
    // });
    // When navigating to the job details
this.router.navigate(['/new-requirement', event.reqId], {
  queryParams: { step, title, tab: tabText, formDisabled, resumeCount: event.profiles }
});
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event;

    
    // Update the URL query parameter to reflect the current tab
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: event === 1 ? 'closed' : 'open' },
      queryParamsHandling: 'merge'
    });

    // Update breadcrumbs
    if (event === 1) {
      this.breadcrumbs = ['Requirements', 'Closed Requirements'];
    } else {
      this.breadcrumbs = ['Requirements', 'Open Requirements'];
    }
  }
  onAddNewRequirement(): void {
    // Update breadcrumbs for new requirement page
    this.breadcrumbs = ['Requirements', 'New Requirement'];
    // Navigate to the new requirement page
    this.router.navigate(['/new-requirement']);
  }
}
