import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, Subscription } from 'rxjs';
import { BreadcrumbService, BreadcrumbItem } from '../../../core/services/breadcrumb.service';

const ROUTE_MAP: Record<string, { label: string; icon: string }> = {
  'dashboard': { label: 'Dashboard', icon: 'layout-dashboard' },
  'pos': { label: 'Point of Sale (POS)', icon: 'shopping-cart' },
  'inventory': { label: 'Inventory & Stock', icon: 'package' },
  'purchases': { label: 'Procurement & GRN', icon: 'truck' },
  'sales': { label: 'Sales & Invoices', icon: 'file-text' },
  'cash': { label: 'Cash Drawer & Shifts', icon: 'wallet' },
  'expenses': { label: 'Operating Expenses', icon: 'receipt' },
  'customers': { label: 'Customer Directory & Credit', icon: 'users' },
  'assets': { label: 'Fixed Assets & Hardware', icon: 'monitor' },
  'reports': { label: 'Profit & Financial Analytics', icon: 'bar-chart-3' },
  'users': { label: 'Staff Accounts & Roles', icon: 'shield-check' },
  'settings': { label: 'System Settings', icon: 'settings' }
};

const KNOWN_TABS: Record<string, Record<string, { label: string; icon: string }>> = {
  'settings': {
    'profile': { label: '1. Pharmacy Profile', icon: 'store' },
    'users': { label: '2. User Management', icon: 'users' },
    'permissions': { label: '3. Role & Permissions', icon: 'shield' },
    'tax': { label: '4. Tax Configuration', icon: 'percent' },
    'system': { label: '5. System Preferences', icon: 'sliders' },
    'notifications': { label: '6. Notifications', icon: 'bell' },
    'backup': { label: '7. Backup & Data', icon: 'database' }
  },
  'inventory': {
    'DRUGS': { label: 'Drug Catalog & Formulation', icon: 'pill' },
    'BATCHES': { label: 'Batches & FEFO Expiry', icon: 'calendar' },
    'MOVEMENTS': { label: 'Stock Movement Ledger', icon: 'history' },
    'CATEGORIES': { label: 'Drug Categories', icon: 'tag' }
  },
  'reports': {
    'PL': { label: 'Profit & Loss Statement', icon: 'trending-up' },
    'VALUATION': { label: 'Inventory Valuation', icon: 'dollar-sign' },
    'TENDER': { label: 'Payment Tender Breakdown', icon: 'credit-card' }
  }
};

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <nav *ngIf="breadcrumbs().length > 0" aria-label="Breadcrumb" class="breadcrumbs-container">
      <ol class="breadcrumbs-list">
        <!-- Root Home Link -->
        <li class="breadcrumb-item">
          <a routerLink="/dashboard" class="breadcrumb-link" title="Dashboard">
            <lucide-icon name="home" [size]="14"></lucide-icon>
            <span class="sr-only">Home</span>
          </a>
        </li>

        <!-- Breadcrumb Items Sequence -->
        <li *ngFor="let item of breadcrumbs(); let last = last" class="breadcrumb-item">
          <lucide-icon name="chevron-right" [size]="13" class="separator-icon"></lucide-icon>
          
          <!-- Clickable Parent Link -->
          <a *ngIf="!last && item.url" 
             [routerLink]="item.url" 
             [queryParams]="item.queryParams || null"
             class="breadcrumb-link">
            <lucide-icon *ngIf="item.icon" [name]="item.icon" [size]="14"></lucide-icon>
            <span>{{ item.label }}</span>
          </a>

          <!-- Active Current Sub-Item -->
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
      margin-bottom: 14px;
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
      transition: all 0.15s ease;
      padding: 2px 6px;
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
      color: #0f172a;
      font-weight: 700;
      padding: 2px 6px;
      background: #f8fafc;
      border-radius: 4px;
      border: 1px solid #f1f5f9;
    }

    .separator-icon {
      color: #94a3b8;
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
  breadcrumbService = inject(BreadcrumbService);
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
    const rawUrl = this.router.url;
    const urlWithoutParams = rawUrl.split('?')[0];
    const segments = urlWithoutParams.split('/').filter(s => s.length > 0);

    // Extract query params for sub-tab detection
    const queryParams: Record<string, string> = {};
    if (rawUrl.includes('?')) {
      const searchParams = new URLSearchParams(rawUrl.split('?')[1]);
      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
    }
    
    // Default Dashboard view
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
        isCurrent: i === segments.length - 1 && !queryParams['tab'] && !queryParams['customerId'] && this.breadcrumbService.subItems().length === 0
      });
    }

    const mainSegment = segments[0];

    // Check query param sub-tabs (e.g. ?tab=users or ?tab=BATCHES)
    if (queryParams['tab'] && KNOWN_TABS[mainSegment] && KNOWN_TABS[mainSegment][queryParams['tab']]) {
      const sub = KNOWN_TABS[mainSegment][queryParams['tab']];
      // Parent main tab is now a clickable link
      if (items.length > 0) items[items.length - 1].isCurrent = false;

      items.push({
        label: sub.label,
        url: `${accumulatedUrl}`,
        queryParams: { tab: queryParams['tab'] },
        icon: sub.icon,
        isCurrent: true
      });
    } else if (queryParams['customerId']) {
      if (items.length > 0) items[items.length - 1].isCurrent = false;
      items.push({
        label: `Customer #${queryParams['customerId']}`,
        url: accumulatedUrl,
        queryParams: { customerId: queryParams['customerId'] },
        icon: 'user',
        isCurrent: true
      });
    } else {
      // Check if custom subItems are set via BreadcrumbService
      const serviceSubItems = this.breadcrumbService.subItems();
      if (serviceSubItems.length > 0) {
        if (items.length > 0) items[items.length - 1].isCurrent = false;
        items.push(...serviceSubItems);
      }
    }

    this.breadcrumbs.set(items);
  }

  private formatSegment(segment: string): string {
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
