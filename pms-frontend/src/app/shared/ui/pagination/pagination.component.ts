import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="totalItems > 0" class="pms-pagination-bar">
      <!-- Left: Counter and Page Size -->
      <div class="pms-pagination-left">
        <div class="pms-pagination-info">
          <span class="pms-range-badge">{{ startItemIndex }}–{{ endItemIndex }}</span>
          <span class="pms-info-text">of <strong>{{ totalItems }}</strong> entries</span>
        </div>

        <div *ngIf="showPageSizeSelector" class="pms-page-size-wrapper">
          <span class="pms-page-size-label">Rows:</span>
          <select 
            [ngModel]="pageSize" 
            (ngModelChange)="onPageSizeChange($event)"
            class="pms-page-size-select">
            <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }} / page</option>
          </select>
        </div>
      </div>

      <!-- Right: Navigation Controls -->
      <div class="pms-pagination-nav">
        <!-- First Page -->
        <button
          type="button"
          (click)="goToPage(1)"
          [disabled]="currentPage === 1"
          title="First Page"
          class="pms-nav-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </button>

        <!-- Previous Page -->
        <button
          type="button"
          (click)="goToPage(currentPage - 1)"
          [disabled]="currentPage === 1"
          title="Previous Page"
          class="pms-nav-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <!-- Page Pills -->
        <div class="pms-page-pills">
          <ng-container *ngFor="let p of pages">
            <span *ngIf="p === -1" class="pms-ellipsis">···</span>
            <button
              *ngIf="p !== -1"
              type="button"
              (click)="goToPage(p)"
              [class.active]="p === currentPage"
              class="pms-page-btn">
              {{ p }}
            </button>
          </ng-container>
        </div>

        <!-- Next Page -->
        <button
          type="button"
          (click)="goToPage(currentPage + 1)"
          [disabled]="currentPage >= totalPages"
          title="Next Page"
          class="pms-nav-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <!-- Last Page -->
        <button
          type="button"
          (click)="goToPage(totalPages)"
          [disabled]="currentPage >= totalPages"
          title="Last Page"
          class="pms-nav-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pms-pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      background: #f8fafc;
      border-bottom: 1px solid var(--slate-200, #e2e8f0);
      font-size: 12px;
      color: var(--slate-600, #475569);
      user-select: none;
      flex-wrap: wrap;
    }

    .pms-pagination-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .pms-pagination-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .pms-range-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      background: #ffffff;
      border: 1px solid var(--slate-300, #cbd5e1);
      border-radius: 6px;
      font-weight: 700;
      color: var(--slate-900, #0f172a);
      font-size: 11px;
      letter-spacing: -0.01em;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .pms-info-text {
      color: var(--slate-500, #64748b);
      font-size: 12px;
    }

    .pms-info-text strong {
      color: var(--slate-900, #0f172a);
      font-weight: 700;
    }

    .pms-page-size-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-left: 12px;
      border-left: 1px solid var(--slate-200, #e2e8f0);
    }

    .pms-page-size-label {
      font-size: 12px;
      color: var(--slate-500, #64748b);
      font-weight: 600;
    }

    .pms-page-size-select {
      padding: 4px 8px;
      background: #ffffff;
      border: 1px solid var(--slate-300, #cbd5e1);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--slate-800, #1e293b);
      cursor: pointer;
      outline: none;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      transition: all 0.15s ease;
    }

    .pms-page-size-select:focus {
      border-color: var(--primary, #0284c7);
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
    }

    .pms-pagination-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pms-nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      background: #ffffff;
      border: 1px solid var(--slate-200, #e2e8f0);
      border-radius: 6px;
      color: var(--slate-600, #475569);
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .pms-nav-btn:hover:not(:disabled) {
      background: var(--slate-100, #f1f5f9);
      color: var(--slate-900, #0f172a);
      border-color: var(--slate-300, #cbd5e1);
    }

    .pms-nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      background: transparent;
      box-shadow: none;
    }

    .pms-page-pills {
      display: flex;
      align-items: center;
      gap: 3px;
      margin: 0 2px;
    }

    .pms-page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 6px;
      background: #ffffff;
      border: 1px solid var(--slate-200, #e2e8f0);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--slate-700, #334155);
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .pms-page-btn:hover:not(.active) {
      background: var(--slate-100, #f1f5f9);
      color: var(--slate-900, #0f172a);
      border-color: var(--slate-300, #cbd5e1);
    }

    .pms-page-btn.active {
      background: var(--primary, #0284c7);
      border-color: var(--primary, #0284c7);
      color: #ffffff;
      font-weight: 800;
      box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);
    }

    .pms-ellipsis {
      padding: 0 4px;
      color: var(--slate-400, #94a3b8);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
    }
  `]
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];
  @Input() showPageSizeSelector: boolean = true;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages: number = 1;
  pages: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePages();
  }

  get startItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  calculatePages(): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / (this.pageSize || 10)));
    
    // Ensure currentPage is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
      this.pageChange.emit(this.currentPage);
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
      this.pageChange.emit(this.currentPage);
    }

    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Number of pages to show around current page

    if (total <= 7) {
      this.pages = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    const range: number[] = [];
    const rangeWithDots: number[] = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push(-1); // represents ellipsis
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    this.pages = rangeWithDots;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.calculatePages();
      this.pageChange.emit(this.currentPage);
    }
  }

  onPageSizeChange(newSize: any): void {
    const size = Number(newSize);
    if (size > 0 && size !== this.pageSize) {
      this.pageSize = size;
      this.currentPage = 1;
      this.calculatePages();
      this.pageSizeChange.emit(this.pageSize);
      this.pageChange.emit(this.currentPage);
    }
  }
}
