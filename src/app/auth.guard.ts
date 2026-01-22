
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AiService } from './components/services/ai.service'; // Adjust path as needed
// removed incorrect Node 'console' import; use browser console directly (console.log)

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  empId: string = '';

  constructor(private router: Router, private aiService: AiService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // If running on a development machine's IP, redirect to SSO login immediately.
    // Replace 192.168.29.202 with your laptop IP if different.
    if (typeof window !== 'undefined' && window.location.hostname === '192.168.29.202') {
      try { localStorage.setItem('redirectAfterLogin', state.url); } catch {}
      // Redirect to the SSO login endpoint used by your org (unchanged from existing behavior)
      window.location.href = 'https://10.179.82.226:8443/login';
      return of(false);
    }

    // Short-circuit auth in localhost development so you can view the dashboard
    // without hitting the SSO backend. This stays limited to localhost/127.0.0.1
    // and should NOT be used in production.
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      // Optionally set a fake empId in the service for local UI behavior
      try { localStorage.setItem('isLoggedIn', 'true'); } catch {}
      return of(true);
    }

    return this.aiService.isloginCheck().pipe(
      map(response => {
        if (response.logged_in) {
          this.aiService.setEmpId(response.emp_id);
          this.empId = response.emp_id;
          return true;
        } else {
          localStorage.setItem('redirectAfterLogin', state.url);
           window.location.href = 'https://10.179.82.226:8443/login';
          return false;
        }
      }),
      catchError(() => {
        localStorage.setItem('redirectAfterLogin', state.url);
         window.location.href = 'https://10.179.82.226:8443/login';
        return of(false);
      })
    );
  }
}
