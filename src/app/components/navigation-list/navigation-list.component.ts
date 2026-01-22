import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, effect, input, Input, InputSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';

import { SidenavWidth } from '../navigation/sidenav-width.enum';
import { ListItem } from './list-item.types';
import { SubmenuComponent } from "../submenu/submenu.component";
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-navigation-list',
    imports: [
        CommonModule,
        MatListModule,
        MatMenuModule,
        MatIconModule,
        CdkMenuTrigger,
        SubmenuComponent,
        RouterModule,
    ],
    templateUrl: './navigation-list.component.html',
    styleUrl: './navigation-list.component.scss'
})
export class NavigationListComponent {
	@Input() isSubmenu: boolean = false;
	@Input() parentLabel: string = '';
	@Input() navListItems!: ListItem[];
	@Input() isExpanded: boolean = false;
	@Input() nestingLevel: number = 0;
	@Input() isHandset!: boolean | undefined;
	sidenavWidthDesktop: InputSignal<string | undefined> = input();
	
	sidenavWidthEnum: typeof SidenavWidth = SidenavWidth;
	expandedItems: string[] = [];

	constructor() {
		// collapse all submenus when switching to mini sidenav
		effect(() => {
			if (this.sidenavWidthDesktop() === SidenavWidth.MINI) {
				this.expandedItems = [];
			}
		});
	}
  
	expandCollapse(listItemTitle: string) {
		if (this.expandedItems.includes(listItemTitle)) {
			this.expandedItems.splice(this.expandedItems.indexOf(listItemTitle), 1);
		} else {
			this.expandedItems.push(listItemTitle);
		}
	}

	getSubmenuFor(label: string) {

	}

}
