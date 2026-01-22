import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
    selector: 'app-breadcrumbs',
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
    ],
    templateUrl: './breadcrumbs.component.html',
    styleUrl: './breadcrumbs.component.scss'
})
export class BreadcrumbsComponent implements OnInit {
  @Input() fragments: string[] = [];
  lastFragment: string | undefined = '';
  activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
	if (!this.fragments || this.fragments.length === 0) {
	  // Get all path fragments if not provided as input
	  this.fragments = this.getAllPathFragments();
	}
	this.lastFragment = this.fragments.length > 0 ? this.fragments[this.fragments.length - 1] : undefined;
  }

  getAllPathFragments(): string[] {
	const fragments: string[] = [];
	let currentRoute: ActivatedRoute | null = this.activatedRoute;
	while (currentRoute) {
	  if (currentRoute.snapshot.url.length > 0) {
		fragments.unshift(...currentRoute.snapshot.url.map(segment => segment.path));
	  }
	  currentRoute = currentRoute.parent;
	}
	return fragments;
  }
}
