import { inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree, ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AiInterviewService } from './ai-interview.service';
import { catchError, map } from 'rxjs/operators';
import { AiService } from '../components/services/ai.service';
import { SpinnerService } from '../components/services/spinner.service';

@Injectable({
  providedIn: 'root'
})

export class InterviewAccessGuard implements CanActivate {
    private route = inject(ActivatedRoute);
    private aiservice = inject(AiService);
    constructor(private router: Router) {}
    private spinnerService = inject(SpinnerService);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const id = route.params['id'];
    return this.aiservice.getCandidateDetails({ id }).pipe(
      map(data => {
        if (data.interview_status === 'pending' && data.isEarlyAccess && !data.isLinkExpired) {
          return true; // Allow access to early access page
        }
        if (!data.isEarlyAccess && !data.isLinkExpired && data.interview_status === 'pending') {
          return this.router.createUrlTree(['/interview-precheck', id]);
        }
        if (!data.isEarlyAccess && data.isLinkExpired && data.interview_status === 'pending') {
          return this.router.createUrlTree(['/error-message'], { queryParams: { reason: 'expired' } });
        }
        if (data.interview_status === 'completed') {
          return this.router.createUrlTree(['/error-message'], { queryParams: { reason: 'completed' } });
        }
        // Default: invalid state
        return this.router.createUrlTree(['/error'], { queryParams: { reason: 'invalid' } });
      }),
      catchError(() => of(this.router.createUrlTree(['/error'], { queryParams: { reason: 'invalid' } })))
    );
  }
}