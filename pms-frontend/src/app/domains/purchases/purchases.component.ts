import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Procurement & Goods Received (GRN)</h1>
          <p style="font-size: 13px; color: var(--slate-500);">Manage pharmaceutical supplier orders and inventory intake</p>
        </div>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
            <tr>
              <th style="padding: 12px 16px;">PO Number</th>
              <th style="padding: 12px 16px;">Supplier</th>
              <th style="padding: 12px 16px;">Order Date</th>
              <th style="padding: 12px 16px;">Total Cost</th>
              <th style="padding: 12px 16px;">Status</th>
              <th style="padding: 12px 16px; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let po of orders()" style="border-bottom: 1px solid var(--slate-100);">
              <td style="padding: 12px 16px; font-weight: 700;"><code>{{ po.poNumber }}</code></td>
              <td style="padding: 12px 16px;">{{ po.supplier?.name || 'Local Supplier' }}</td>
              <td style="padding: 12px 16px;">{{ po.orderDate }}</td>
              <td style="padding: 12px 16px; font-weight: 600;">ETB {{ po.totalAmount | number:'1.2-2' }}</td>
              <td style="padding: 12px 16px;">
                <span class="badge" [ngClass]="po.status === 'RECEIVED' ? 'badge-success' : 'badge-warning'" style="display: inline-flex; align-items: center; gap: 4px;">
                  <lucide-icon [name]="po.status === 'RECEIVED' ? 'package-check' : 'truck'" [size]="12"></lucide-icon>
                  {{ po.status }}
                </span>
              </td>
              <td style="padding: 12px 16px; text-align: right;">
                <button *ngIf="po.status !== 'RECEIVED'" (click)="receiveGoods(po.id)" class="btn btn-success" style="padding: 5px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                  <lucide-icon name="package-check" [size]="14"></lucide-icon> Receive GRN
                </button>
              </td>
            </tr>
            <tr *ngIf="orders().length === 0">
              <td colspan="6" style="text-align: center; padding: 36px; color: var(--slate-400);">
                No procurement orders recorded.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PurchasesComponent implements OnInit {
  orders = signal<any[]>([]);

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.http.get<any>(`${environment.apiUrl}/purchases`).subscribe({
      next: (res) => this.orders.set(res.data || [])
    });
  }

  receiveGoods(poId: number): void {
    this.http.post<any>(`${environment.apiUrl}/purchases/${poId}/receive`, {}).subscribe({
      next: () => {
        this.notificationService.success('Goods received and batch inventory created!');
        this.loadOrders();
      }
    });
  }
}
