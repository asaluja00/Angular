import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Component, inject } from '@angular/core';
import { AiService } from './components/services/ai.service';
import { MatIconRegistry } from '@angular/material/icon';
import { NavigationComponent } from "./components/navigation/navigation.component";
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-root',
    imports: [CommonModule, NavigationComponent, RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'app-template';
  savedTheme: string = '';
  isLoggedIn = false;
    isLoading = false;

  showInterviewPage: boolean = false;
  showNewInterviewPage:boolean = false;
  showEarlyAccessPage: boolean =  false;
  showStartedInterviewPage: boolean = false;
  showErrorMessage: boolean = false;
  showInterviewPrecheck: boolean = false;
  private router = inject(Router);

  private matIconRegistry = inject(MatIconRegistry);
  private aiService = inject(AiService);
  

  ngOnInit() {
    this.matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    document.documentElement.className = `purple-theme`;


     // Ensure login state is checked before subscribing
    this.aiService.checkInitialLoginState();
    setTimeout(() => {
      this.aiService.isLoggedIn$.subscribe(val => {
        this.isLoggedIn = val;
        console.log('Is Logged In app component (subscription):', this.isLoggedIn);
        // If logged in, try to load user display name and ID if needed
        if (this.isLoggedIn) {
          const storedDisplayName = localStorage.getItem('userDisplayName');
          const storedEmplId = localStorage.getItem('emplId');
          if (storedDisplayName && storedEmplId) {
            this.aiService.setEmpId(storedEmplId);
            this.aiService.setDisplayName(storedDisplayName);
          }
        }
      });
    }, 0);

        // Redirect after login if needed
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin');
      this.router.navigateByUrl(redirectUrl);
    }
 
 

 // Standard Angular way: show spinner on navigation start, hide on end
 this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isLoading = false;
      }
      const url = this.router.url;
      this.showNewInterviewPage = /^\/interview\/[^\/]+\/?$/.test(url);
      this.showInterviewPage = url.startsWith('/interview-profile-cards');
      this.showEarlyAccessPage = /^\/early-access\/[^\/]+\/?$/.test(url);
      this.showStartedInterviewPage = url.startsWith('/started-interview');
      this.showErrorMessage = url.startsWith('/error-message');
      this.showInterviewPrecheck = url.startsWith('/interview-precheck');
    });

    


    // Set route flags on initial load
  const initialUrl = this.router.url;
  this.showNewInterviewPage = /^\/interview\/[^\/]+\/?$/.test(initialUrl);
  this.showInterviewPage = initialUrl.startsWith('/interview-profile-cards');
  this.showEarlyAccessPage = /^\/early-access\/[^\/]+\/?$/.test(initialUrl);
  this.showStartedInterviewPage = initialUrl.startsWith('/started-interview');
  this.showErrorMessage = initialUrl.startsWith('/error-message');
  this.showInterviewPrecheck = initialUrl.startsWith('/interview-precheck');
    
  }
}
