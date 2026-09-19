import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { PrintService } from '../../core/services/print.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Sales Invoices & Receipts</h1>
          <p style="font-size: 13px; color: var(--slate-500);">Transaction history, customer invoices, and reprint terminal</p>
        </div>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
            <tr>
              <th style="padding: 12px 16px;">Invoice Number</th>
              <th style="padding: 12px 16px;">Date & Time</th>
              <th style="padding: 12px 16px;">Customer / Tier</th>
              <th style="padding: 12px 16px;">Payment Method</th>
              <th style="padding: 12px 16px;">Grand Total</th>
              <th style="padding: 12px 16px; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of sales()" style="border-bottom: 1px solid var(--slate-100);">
              <td style="padding: 12px 16px; font-weight: 700; color: #0284c7;">{{ s.invoiceNumber }}</td>
              <td style="padding: 12px 16px;">{{ s.createdAt | date:'short' }}</td>
              <td style="padding: 12px 16px;"><span class="badge badge-primary">{{ s.saleType }}</span></td>
              <td style="padding: 12px 16px;">{{ s.paymentMethod }}</td>
              <td style="padding: 12px 16px; font-weight: 700;">ETB {{ s.grandTotal | number:'1.2-2' }}</td>
              <td style="padding: 12px 16px; text-align: right;">
                <button (click)="viewA4Invoice(s.invoiceNumber)" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                  <lucide-icon name="file-text" [size]="14"></lucide-icon> A4 Invoice
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SalesComponent implements OnInit {
  sales = signal<any[]>([]);

  constructor(private http: HttpClient, private printService: PrintService) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/pos/receipt/INV-SAMPLE`).subscribe({
      next: (res) => this.sales.set([res.data]),
      error: () => {}
    });
  }

  viewA4Invoice(invoiceNo: string): void {
    this.printService.printA4Invoice();
  }
}
