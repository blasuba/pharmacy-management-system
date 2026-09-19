import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { PrintService } from '../../core/services/print.service';
import { environment } from '../../../environments/environment';

interface CartItem {
  drugId: number;
  drugName: string;
  genericName: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  discount: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div style="display: grid; grid-template-columns: 1fr 420px; gap: 24px; height: calc(100vh - 120px);">
      <!-- Left Column: Search & Drug Catalog -->
      <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
        <div class="card" style="padding: 16px;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; position: relative;">
              <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
              <input type="text" [(ngModel)]="searchQuery" (input)="searchDrugs()"
                     class="form-control" style="padding-left: 36px;" placeholder="Search drug by brand name, generic name, or scan barcode..." autofocus />
            </div>
            <select [(ngModel)]="customerType" (change)="recalculateCart()" class="form-control" style="width: 180px;">
              <option value="RETAIL">Retail Tier</option>
              <option value="WHOLESALE">Wholesale Tier</option>
              <option value="DISTRIBUTOR">Distributor Tier</option>
            </select>
          </div>
        </div>

        <!-- Drug Search Results Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
          <div *ngFor="let drug of drugs()" class="card" style="padding: 14px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.1s;" (click)="addToCart(drug)">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4 style="font-size: 14px; font-weight: 700; color: var(--slate-900);">{{ drug.name }}</h4>
                <span class="badge" [ngClass]="drug.totalStock > drug.reorderThreshold ? 'badge-success' : 'badge-danger'">
                  {{ drug.totalStock }} {{ drug.unitOfMeasure }}
                </span>
              </div>
              <p style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">{{ drug.genericName }}</p>
              <div style="font-size: 11px; color: #0284c7; margin-top: 4px;">{{ drug.dosageForm }} • {{ drug.strength }}</div>
            </div>

            <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span class="badge badge-primary" style="display: inline-flex; align-items: center; gap: 4px;">
                <lucide-icon name="boxes" [size]="11"></lucide-icon> FEFO Active
              </span>
              <button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                <lucide-icon name="plus" [size]="12"></lucide-icon> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: POS Cart Drawer -->
      <div class="card" style="display: flex; flex-direction: column; height: 100%; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px; margin-bottom: 12px;">
          <h3 style="font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <lucide-icon name="shopping-cart" [size]="16" color="#0284c7"></lucide-icon> Cart ({{ cart().length }} items)
          </h3>
          <button (click)="clearCart()" class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; color: #ef4444; display: inline-flex; align-items: center; gap: 4px;">
            <lucide-icon name="trash-2" [size]="12"></lucide-icon> Clear
          </button>
        </div>

        <!-- Cart Items List -->
        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
          <div *ngFor="let item of cart(); let idx = index" style="padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200);">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600;">
              <span>{{ item.drugName }}</span>
              <span>ETB {{ item.unitPrice * item.quantity | number:'1.2-2' }}</span>
            </div>
            <div style="font-size: 11px; color: var(--slate-500);">{{ item.genericName }}</div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <button (click)="changeQty(idx, -1)" style="width: 24px; height: 24px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <lucide-icon name="minus" [size]="11"></lucide-icon>
                </button>
                <span style="font-size: 13px; font-weight: 700; width: 28px; text-align: center;">{{ item.quantity }}</span>
                <button (click)="changeQty(idx, 1)" style="width: 24px; height: 24px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <lucide-icon name="plus" [size]="11"></lucide-icon>
                </button>
              </div>
              <button (click)="removeItem(idx)" style="background: none; border: none; color: #ef4444; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                <lucide-icon name="trash-2" [size]="12"></lucide-icon> Remove
              </button>
            </div>
          </div>

          <div *ngIf="cart().length === 0" style="text-align: center; color: var(--slate-400); padding: 40px 0; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <lucide-icon name="shopping-bag" [size]="32" color="#94a3b8"></lucide-icon>
            Cart is empty. Click drugs or scan barcode to add.
          </div>
        </div>

        <!-- Cart Total & Payment Trigger -->
        <div style="border-top: 1px solid var(--slate-200); padding-top: 16px; margin-top: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
            <span style="color: var(--slate-600);">Subtotal:</span>
            <span style="font-weight: 600;">ETB {{ calculateSubtotal() | number:'1.2-2' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: var(--slate-900); margin-bottom: 16px;">
            <span>Grand Total:</span>
            <span style="color: #0284c7;">ETB {{ calculateSubtotal() | number:'1.2-2' }}</span>
          </div>

          <button [disabled]="cart().length === 0" (click)="openPaymentModal()" class="btn btn-success" style="width: 100%; padding: 12px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <lucide-icon name="credit-card" [size]="18"></lucide-icon> Proceed to Payment
          </button>
        </div>
      </div>
    </div>

    <!-- Payment & Receipt Modal -->
    <div *ngIf="showPaymentModal()" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div class="card" style="width: 480px; max-width: 90vw; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="credit-card" [size]="20" color="#0284c7"></lucide-icon> Complete Payment
          </h3>
          <button (click)="showPaymentModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 600; color: var(--slate-600);">Payment Method</label>
          <select [(ngModel)]="paymentMethod" class="form-control" style="margin-top: 4px;">
            <option value="CASH">Cash</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="MOBILE_MONEY">Telebirr / CBE Birr</option>
            <option value="CREDIT_ACCOUNT">On-Account / Credit</option>
          </select>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 12px; font-weight: 600; color: var(--slate-600);">Amount Tendered (ETB)</label>
          <input type="number" [(ngModel)]="paidAmount" class="form-control" style="font-size: 18px; font-weight: 700; margin-top: 4px;" />
        </div>

        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span>Total Payable:</span>
            <strong>ETB {{ calculateSubtotal() | number:'1.2-2' }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #059669; margin-top: 4px;">
            <span>Change Due:</span>
            <span>ETB {{ (paidAmount - calculateSubtotal()) > 0 ? (paidAmount - calculateSubtotal() | number:'1.2-2') : '0.00' }}</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button (click)="showPaymentModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
          <button (click)="finalizeCheckout()" class="btn btn-primary" style="flex: 2; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <lucide-icon name="printer" [size]="16"></lucide-icon> Confirm & Print Receipt
          </button>
        </div>
      </div>
    </div>

    <!-- Printable Thermal Receipt Template (Overlay / Print Media) -->
    <div *ngIf="lastReceipt()" class="printable-area thermal-receipt" style="display: none;">
      <div style="text-align: center; margin-bottom: 8px;">
        <h2 style="font-size: 16px; font-weight: bold;">APEX CENTRAL PHARMACY</h2>
        <p>License: PH-ET-2026-88910</p>
        <p>Tel: +251-911-000000</p>
        <hr style="margin: 6px 0; border-top: 1px dashed #000;">
      </div>
      <div>
        <p>Invoice: {{ lastReceipt().invoiceNumber }}</p>
        <p>Date: {{ lastReceipt().createdAt | date:'short' }}</p>
        <p>Cashier: {{ lastReceipt().cashierName }}</p>
        <hr style="margin: 6px 0; border-top: 1px dashed #000;">
      </div>
      <table style="width: 100%; font-size: 11px; text-align: left;">
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of lastReceipt().items">
            <td>{{ item.drugName }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.unitPrice }}</td>
            <td>{{ item.subtotal }}</td>
          </tr>
        </tbody>
      </table>
      <hr style="margin: 6px 0; border-top: 1px dashed #000;">
      <div style="text-align: right; font-size: 12px; font-weight: bold;">
        <p>Grand Total: ETB {{ lastReceipt().grandTotal }}</p>
        <p>Paid: ETB {{ lastReceipt().paidAmount }}</p>
        <p>Change: ETB {{ lastReceipt().changeAmount }}</p>
      </div>
      <div style="text-align: center; margin-top: 12px; font-size: 11px;">
        <p>*** Thank You for Choosing Apex ***</p>
      </div>
    </div>
  `
})
export class PosComponent implements OnInit {
  searchQuery = '';
  customerType = 'RETAIL';
  paymentMethod = 'CASH';
  paidAmount = 0;
  showPaymentModal = signal(false);
  drugs = signal<any[]>([]);
  cart = signal<CartItem[]>([]);
  lastReceipt = signal<any>(null);

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private printService: PrintService
  ) {}

  ngOnInit(): void {
    this.searchDrugs();
  }

  searchDrugs(): void {
    this.http.get<any>(`${environment.apiUrl}/drugs?query=${this.searchQuery}&size=20`).subscribe({
      next: (res) => this.drugs.set(res.data.content || [])
    });
  }

  addToCart(drug: any): void {
    if (drug.totalStock <= 0) {
      this.notificationService.error(`${drug.name} is currently Out of Stock!`);
      return;
    }

    const current = this.cart();
    const existingIndex = current.findIndex(i => i.drugId === drug.id);

    // Approximate unit price default
    let price = 250;
    if (drug.name.includes('Panadol')) price = 55;
    if (drug.name.includes('Zithromax')) price = 450;

    if (existingIndex > -1) {
      if (current[existingIndex].quantity + 1 > drug.totalStock) {
        this.notificationService.warning('Cannot add more than available on-hand stock!');
        return;
      }
      current[existingIndex].quantity += 1;
      this.cart.set([...current]);
    } else {
      this.cart.set([...current, {
        drugId: drug.id,
        drugName: drug.name,
        genericName: drug.genericName,
        quantity: 1,
        unitPrice: price,
        availableStock: drug.totalStock,
        discount: 0
      }]);
    }
  }

  changeQty(index: number, delta: number): void {
    const current = this.cart();
    const newQty = current[index].quantity + delta;
    if (newQty <= 0) {
      this.removeItem(index);
    } else if (newQty > current[index].availableStock) {
      this.notificationService.warning('Requested quantity exceeds on-hand stock!');
    } else {
      current[index].quantity = newQty;
      this.cart.set([...current]);
    }
  }

  removeItem(index: number): void {
    const current = this.cart();
    current.splice(index, 1);
    this.cart.set([...current]);
  }

  clearCart(): void {
    this.cart.set([]);
  }

  recalculateCart(): void {
    // Dynamic price tier adjustment
  }

  calculateSubtotal(): number {
    return this.cart().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  openPaymentModal(): void {
    this.paidAmount = this.calculateSubtotal();
    this.showPaymentModal.set(true);
  }

  finalizeCheckout(): void {
    const payload = {
      saleType: this.customerType,
      paymentMethod: this.paymentMethod,
      paidAmount: this.paidAmount,
      items: this.cart().map(item => ({
        drugId: item.drugId,
        quantity: item.quantity,
        customUnitPrice: item.unitPrice
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/pos/checkout`, payload).subscribe({
      next: (res) => {
        this.showPaymentModal.set(false);
        this.notificationService.success(`Sale completed! Invoice: ${res.data.invoiceNumber}`);
        this.lastReceipt.set(res.data);
        this.cart.set([]);
        this.searchDrugs(); // refresh stock

        // Trigger thermal receipt print
        setTimeout(() => {
          this.printService.printThermalReceipt();
        }, 300);
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Checkout failed');
      }
    });
  }
}
