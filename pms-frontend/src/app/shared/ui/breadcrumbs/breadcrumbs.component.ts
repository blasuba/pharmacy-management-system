import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url: string;
  icon?: string;
  isCurrent: boolean;
}

const ROUTE_MAP: Record<string, { label: string; icon: string }> = {
  'dashboard': { label: 'Dashboard', icon: 'layout-dashboard' },
  'pos': { label: 'POS Terminal & Cashier', icon: 'shopping-cart' },
  'inventory': { label: 'Inventory & Drug Batches', icon: 'package' },
  'purchases': { label: 'Procurement & Suppliers', icon: 'truck' },
  'sales': { label: 'Sales & Receipts', icon: 'file-text' },
  'cash': { label: 'Cash Drawer & Shifts', icon: 'wallet' },
  'customers': { label: 'Customer Directory & Credit', icon: 'users' },
  'assets': { label: 'Fixed Assets & Hardware', icon: 'monitor' },
  'reports': { label: 'Profit & Financial Analytics', icon: 'bar-chart-3' },
  'users': { label: 'Staff Accounts & Roles', icon: 'shield-check' }
};

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <nav *ngIf="breadcrumbs().length > 0" aria-label="Breadcrumb" class="breadcrumbs-container">
      <ol class="breadcrumbs-list">
        <!-- Home Link -->
        <li class="breadcrumb-item">
          <a routerLink="/dashboard" class="breadcrumb-link" title="Dashboard">
            <lucide-icon name="home" [size]="14"></lucide-icon>
            <span class="sr-only">Home</span>
          </a>
        </li>

        <!-- Breadcrumb Items -->
        <li *ngFor="let item of breadcrumbs(); let last = last" class="breadcrumb-item">
          <lucide-icon name="chevron-right" [size]="13" class="separator-icon"></lucide-icon>
          
          <a *ngIf="!last" [routerLink]="item.url" class="breadcrumb-link">
            <lucide-icon *ngIf="item.icon" [name]="item.icon" [size]="14"></lucide-icon>
            <span>{{ item.label }}</span>
          </a>

          <span *ngIf="last" class="breadcrumb-current" aria-current="page">
            <lucide-icon *ngIf="item.icon" [name]="item.icon" [size]="14"></lucide-icon>
            <span>{{ item.label }}</span>
          </span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumbs-container {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .breadcrumbs-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      list-style: none;
      padding: 6px 12px;
      margin: 0;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      font-size: 12px;
    }

    .breadcrumb-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--slate-500);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s ease;
      padding: 2px 4px;
      border-radius: 4px;
    }

    .breadcrumb-link:hover {
      color: #0284c7;
      background: #f0f9ff;
    }

    .breadcrumb-current {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--slate-900);
      font-weight: 700;
      padding: 2px 4px;
    }

    .separator-icon {
      color: var(--slate-400);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs = signal<BreadcrumbItem[]>([]);
  private routerSub?: Subscription;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.buildBreadcrumbs();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private buildBreadcrumbs(): void {
    const url = this.router.url.split('?')[0];
    const segments = url.split('/').filter(s => s.length > 0);
    
    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
      this.breadcrumbs.set([
        {
          label: 'Dashboard Overview',
          url: '/dashboard',
          icon: 'layout-dashboard',
          isCurrent: true
        }
      ]);
      return;
    }

    const items: BreadcrumbItem[] = [];
    let accumulatedUrl = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      accumulatedUrl += `/${seg}`;
      const config = ROUTE_MAP[seg];

      items.push({
        label: config ? config.label : this.formatSegment(seg),
        url: accumulatedUrl,
        icon: config ? config.icon : 'folder',
        isCurrent: i === segments.length - 1
      });
    }

    this.breadcrumbs.set(items);
  }

  private formatSegment(segment: string): string {
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
