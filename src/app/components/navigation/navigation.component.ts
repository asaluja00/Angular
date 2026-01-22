import { Component, inject, HostListener, computed, signal, effect, EventEmitter, output, Output, Input } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { map, shareReplay } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CdkMenu, CdkMenuGroup, CdkMenuItem, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatMenuModule } from '@angular/material/menu';

import { ListItem } from '../navigation-list/list-item.types';
import { NAV_LIST_ITEMS } from '../navigation-list/navigation-list.data';
import { PROFILE_MENU_OPTIONS } from './profile-menu-options.data';
import { SidenavWidth } from './sidenav-width.enum';
import { NavigationListComponent } from "../navigation-list/navigation-list.component";
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AiService } from '../services/ai.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

type ProfileMenuOption = {
	label: string;
	route: string;
}

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrl: './navigation.component.scss',
    imports: [
        RouterOutlet,
        RouterModule,
        MatToolbarModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule,
        MatMenuModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        CdkMenuTrigger,
        CdkMenu,
        CdkMenuItem,
        CdkMenuItemRadio,
        CdkMenuGroup,
        NavigationListComponent,
        MatProgressBarModule,
        CommonModule
    ]
})
export class NavigationComponent {
	userDisplayName: string = '';
	emplId: string = '';
	emailId: string = '';
	deptId: string = '';
	empId: string = '';
	userInitials: string = '';
	private userSub: Subscription = new Subscription();
	private aiService = inject(AiService);
    userDisplayName$ = this.aiService.userDisplayName$;
		userInitials$ = this.userDisplayName$.pipe(
		map(name => {
			if (!name) return '';
			const parts = name.trim().split(' ');
			return parts.length > 1
				? (parts[0][0] + parts[1][0]).toUpperCase()
				: parts[0][0].toUpperCase();
		})
	);
	private router = inject(Router);
	private aiservice = inject(AiService);
	private breakpointObserver = inject(BreakpointObserver);
	private http = inject(HttpClient);
	isDropdownVisible: boolean = false;
	isHandset = toSignal<boolean>(this.breakpointObserver.observe(Breakpoints.Handset)
		.pipe(
			map(result => result.matches),
			shareReplay()
		));

	isPageLoading: boolean = true;
	navListItems: ListItem[] = NAV_LIST_ITEMS;
	// profileMenuOptions: ProfileMenuOption[] = PROFILE_MENU_OPTIONS;
	sidenavWidthEnum: typeof SidenavWidth = SidenavWidth;
	showMiniSidenav = signal(true);
	isMobileDrawerOpen = signal(false);
	sidenavWidthMobile: string = SidenavWidth.FULL;
	sidenavWidthDesktop = computed(() => {
		return this.showMiniSidenav() ? SidenavWidth.MINI : SidenavWidth.FULL;
	});
	// darkMode = signal(false);

	toggleMiniVariant() {
		this.showMiniSidenav.set(!this.showMiniSidenav());
	}
	toggleDropdown(event: MouseEvent): void {
		event?.stopPropagation();
		this.isDropdownVisible = !this.isDropdownVisible;
	}
	onLogout(): void {
		this.aiservice.islogout().subscribe({
			
			next: () => {
				
// After successful API logout, redirect to Microsoft logout
      window.location.href = 'https://10.179.82.226:8443/logout';

				
			},
			error: () => {
				    window.location.href = 'https://10.179.82.226:8443/logout';
			}
		});

	}
	profileMenuOptions = PROFILE_MENU_OPTIONS(this.onLogout.bind(this));
	@HostListener('document:click', ['$event'])
	onClickOutside(event: MouseEvent) {
		const profileContainer = document.querySelector('.profile-container');
		if (profileContainer && !profileContainer.contains(event.target as Node)) {
			this.isDropdownVisible = false; // Hide the logout button if clicked outside
		}
	}
	themes = [
		{ label: 'Blue', value: 'blue', colorCode: '#005cbb' },
		{ label: 'Red', value: 'red', colorCode: '#CC000D' },
		// { label: 'Green', value: 'green', colorCode: '#007700' },
		// { label: 'Orange', value: 'orange', colorCode: '#FF4500' },
		{ label: 'Yellow', value: 'yellow', colorCode: '#DF9500' },
		// { label: 'Pink', value: 'pink', colorCode: '#d11d47' },
		{ label: 'Purple', value: 'purple', colorCode: '#8341a3' },
		{ label: 'Teal', value: 'teal', colorCode: '#006a60' },
		{ label: 'Brown', value: 'brown', colorCode: '#89502b' },
	];

	@Input() savedTheme: string = 'blue';

	selectedTheme = signal(this.savedTheme);

	@Output() onThemeChange = new EventEmitter<string>();

	themeChange(theme: string) {
		this.selectedTheme.set(theme);
		this.onThemeChange.emit(theme);
	}

	constructor() {
		this.router.events.subscribe((event: Event) => {
			if (event instanceof NavigationStart) {
				this.isPageLoading = true;
			} else if (event instanceof NavigationEnd ||
				event instanceof NavigationError ||
				event instanceof NavigationCancel) {
				this.isPageLoading = false;
			}
		});

		this.userSub.add(
			this.aiservice.userDisplayName$.subscribe(name => this.userDisplayName = name)
		);
		this.userSub.add(
			this.aiservice.empId$.subscribe((id: string) => this.emplId = id)
		);

	}


	ngOnInit() {


		this.aiservice.empId$.subscribe((id: string) => {
			this.emplId = id;
			// Now you can use this.emplId safely
		});

		//new code

		// this.aiservice.empId$.subscribe((id: string) => {
	
		// 	this.emplId = id;
		// 	if (id) {
		// 		this.aiservice.getEmpBaseDataById(id).subscribe(empDetails => {
		// 			const base = empDetails.data.employeeBase;
		// 			this.userDisplayName = base.displayName;
		// 			this.emplId = base.emplId;
		// 			this.emailId = base.emailId;
		// 			this.deptId = base.deptId;
		// 			if (this.userDisplayName) {
		// 				const names = this.userDisplayName.split(' ');
		// 				if (names.length > 1) {
		// 					this.userInitials = names[0].charAt(0) + names[1].charAt(0);
		// 				} else {
		// 					this.userInitials = names[0].charAt(0);
		// 				}
		// 				this.userInitials = this.userInitials.toUpperCase();
		// 			}

		// 			// Use empDetails to set display name, department, etc.
		// 		});
		// 	}
		// });

		//new code to change to master api
		this.aiservice.isloginCheck().subscribe({
    next: (res: any) => {
      const base = res?.data?.employeeBase || res;
 
      this.userDisplayName = base.displayName;
      this.emplId = base.emplId;
      this.emailId = base.emailId;
      this.deptId = base.deptId;
 
      if (this.userDisplayName) {
        const names = this.userDisplayName.split(' ');
        this.userInitials =
          names.length > 1
            ? names[0].charAt(0) + names[1].charAt(0)
            : names[0].charAt(0);
 
        this.userInitials = this.userInitials.toUpperCase();
      }
    },
    error: () => {
      console.log('User not logged in');
    }
  });

	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}

// onClick(){
// // 	console.log("button clicked........");
	
//  window.location.href = 'https://10.179.82.226:8443/logout';
// // this.http.post("https://10.179.82.226:8443/logout",{},{withCredentials:true }).subscribe(()=>{
// //  window.location.href = 'https://10.179.82.226:8443/logout';

// // });

// }
}
