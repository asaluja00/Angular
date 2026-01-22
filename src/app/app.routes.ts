import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NewRequirementComponent } from './components/new-requirement/new-requirement.component';
import { AddRequirementsJobDetailsComponent } from './components/add-requirements-job-details/add-requirements-job-details.component';
import { OpenCloseRequirementsComponent } from './components/open-close-requirements/open-close-requirements.component';
import { InterviewProfileCardsComponent } from './components/interview-profile-cards/interview-profile-cards.component';
import { EarlyAccessComponent } from './components/early-access/early-access.component';
import { InterviewPreCheckComponent } from './components/interview-precheck/interview-precheck.component';
import { StartedInterviewComponent } from './components/started-interview/started-interview.component';
import { ViewAnalyzeProfilesComponent } from './components/view-analyze-profiles/view-analyze-profiles.component';
import { ViewRequirementDetailsComponent } from './components/view-requirement-details/view-requirement-details.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { InterviewComponent} from './components/interview/interview.component'
import { AuthGuard } from './auth.guard';
import { InterviewAccessGuard } from './services/interview-access.guard';



export const routes: Routes = [
    {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
    {path: 'dashboard', component: DashboardComponent, title: 'Dashboard', canActivate: [AuthGuard]},
    {path: 'new-requirement', component: NewRequirementComponent, title: 'New Requirement' , canActivate: [AuthGuard]},
    {path: 'new-requirement/:reqId', component: NewRequirementComponent, title: 'New Requirement',canActivate: [AuthGuard] },
    {path: 'add-requirement-job', component:AddRequirementsJobDetailsComponent, title: 'New Requirement',canActivate: [AuthGuard]},
    {path:'open-close-requirement', component:OpenCloseRequirementsComponent, title: 'Open/Close Requirement',canActivate: [AuthGuard]},
    {path: 'view-analyze-profiles/:reqId',component: ViewAnalyzeProfilesComponent, canActivate: [AuthGuard]},
    {path: 'interview-profile-cards/:id', component: InterviewProfileCardsComponent, title: 'Interview Profile Cards', canActivate: [AuthGuard]},
    {path:'interview/:id', component:InterviewComponent, canActivate: [AuthGuard]},
    {path:'early-access/:id', component: EarlyAccessComponent,canActivate: [AuthGuard,InterviewAccessGuard]},
    {path:'interview-precheck/:id', component: InterviewPreCheckComponent, title: 'Interview Precheck',canActivate: [AuthGuard]},
    {path:'started-interview/:id', component: StartedInterviewComponent,title: 'Started Interview', canActivate: [AuthGuard]},
    {path:'view-requirement-details/:reqId', component: ViewRequirementDetailsComponent, title: 'View Requirement Details',canActivate: [AuthGuard]},
    {path:'error-message', component: ErrorMessageComponent, canActivate: [AuthGuard]},   
];
