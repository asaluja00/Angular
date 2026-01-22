import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ListItem } from '../navigation-list/list-item.types';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-submenu',
    imports: [
        CommonModule,
        CdkMenuTrigger,
        CdkMenu,
        CdkMenuItem,
        MatIconModule,
        RouterModule,
    ],
    templateUrl: './submenu.component.html',
    styleUrl: './submenu.component.scss'
})
export class SubmenuComponent {
	@Input() nestingLevel: number = 0;
	@Input() navListItems!: ListItem[];
}
