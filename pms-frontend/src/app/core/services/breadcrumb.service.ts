import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  queryParams?: Record<string, any>;
  icon?: string;
  isCurrent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  subItems = signal<BreadcrumbItem[]>([]);

  setSubItem(label: string, icon?: string, queryParams?: Record<string, any>, url?: string): void {
    this.subItems.set([{ label, icon, queryParams, url, isCurrent: true }]);
  }

  setSubItems(items: BreadcrumbItem[]): void {
    this.subItems.set(items);
  }

  clearSubItems(): void {
    this.subItems.set([]);
  }
}
