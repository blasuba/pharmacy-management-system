import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pms-toolbar-card">
      <div class="pms-toolbar-row">
        <!-- Search & Filter Controls -->
        <div class="pms-toolbar-filters">
          <!-- Search input -->
          <div *ngIf="showSearch" class="pms-search-input-wrapper">
            <span class="pms-search-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input
              type="text"
              [placeholder]="placeholder"
              [ngModel]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              class="pms-search-field"
            />
            <button
              *ngIf="searchTerm"
              (click)="clearSearch()"
              title="Clear search"
              class="pms-search-clear">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Projected Dropdowns / Custom Filters -->
          <ng-content select="[filters]"></ng-content>

          <!-- Reset Filter Button -->
          <button
            *ngIf="showReset"
            (click)="resetFilters.emit()"
            type="button"
            class="btn btn-outline"
            style="padding: 7px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Reset
          </button>
        </div>

        <!-- Projected Actions / Export / Create Buttons -->
        <div class="pms-toolbar-actions">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pms-toolbar-card {
      background: #ffffff;
      padding: 14px 18px;
      border-radius: var(--radius, 12px);
      border: 1px solid var(--slate-200, #e2e8f0);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-bottom: 14px;
    }

    .pms-toolbar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .pms-toolbar-filters {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      flex-wrap: wrap;
    }

    .pms-search-input-wrapper {
      position: relative;
      flex: 1;
      min-width: 240px;
      max-width: 420px;
    }

    .pms-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--slate-400, #94a3b8);
      pointer-events: none;
      display: flex;
      align-items: center;
    }

    .pms-search-field {
      width: 100%;
      padding: 9px 32px 9px 36px;
      font-size: 13px;
      background: #f8fafc;
      border: 1px solid var(--slate-200, #e2e8f0);
      border-radius: var(--radius, 10px);
      outline: none;
      transition: all 0.15s ease;
      color: var(--slate-800, #1e293b);
    }

    .pms-search-field:focus {
      background: #ffffff;
      border-color: var(--primary, #0284c7);
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
    }

    .pms-search-clear {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--slate-400, #94a3b8);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0;
    }

    .pms-search-clear:hover {
      color: var(--slate-700, #334155);
    }

    .pms-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class FilterToolbarComponent {
  @Input() placeholder: string = 'Search...';
  @Input() searchTerm: string = '';
  @Input() showSearch: boolean = true;
  @Input() showReset: boolean = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() resetFilters = new EventEmitter<void>();

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchChange.emit('');
  }
}
