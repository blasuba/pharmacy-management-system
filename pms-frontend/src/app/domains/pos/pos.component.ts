import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { ValidationService } from '../../core/services/validation.service';
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
  prescriptionRequired?: boolean;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <!-- Shift Alert Banner -->
      <div *ngIf="!activeShift" class="card" style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #92400e; font-weight: 600;">
          <lucide-icon name="alert-triangle" [size]="18" color="#d97706"></lucide-icon>
          <span>Cash drawer is CLOSED. Please open a register shift float to record cash transactions.</span>
        </div>
        <a [routerLink]="['/cash']" class="btn btn-warning" style="padding: 6px 12px; font-size: 12px; background: #d97706; color: #fff;">
          Open Float
        </a>
      </div>

      <!-- Main Layout: 2 Columns (Catalog on Left, Cart on Right) -->
      <div style="display: grid; grid-template-columns: 1fr 380px; gap: 18px; align-items: start;">
        <!-- Left Side: Catalog & Search -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Search & Customer Bar -->
          <div class="card" style="padding: 14px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 240px; position: relative;">
              <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
              <input type="text" [(ngModel)]="searchQuery" (input)="searchDrugs()"
                     class="form-control" style="padding-left: 36px;" placeholder="Search medication by name, generic formulation, or barcode..." autofocus />
            </div>

            <select [(ngModel)]="selectedCustomerId" (change)="onCustomerSelected()" class="form-control" style="width: auto; min-width: 170px;">
              <option [ngValue]="null">Walk-in Customer</option>
              <option *ngFor="let c of customers" [ngValue]="c.id">{{ c.name }}</option>
            </select>

            <select [(ngModel)]="customerType" class="form-control" style="width: auto; min-width: 140px;">
              <option value="RETAIL">Retail Pricing</option>
              <option value="WHOLESALE">Wholesale Tier</option>
              <option value="DISTRIBUTOR">Distributor Tier</option>
            </select>
          </div>

          <!-- Drugs Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; max-height: calc(100vh - 240px); overflow-y: auto; padding-right: 4px;">
            <div *ngFor="let drug of drugs()" (click)="addToCart(drug)" class="card"
                 style="padding: 14px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: border-color 0.15s, box-shadow 0.15s;"
                 onmouseover="this.style.borderColor='#0284c7'; this.style.boxShadow='var(--shadow)'"
                 onmouseout="this.style.borderColor='var(--slate-200)'; this.style.boxShadow='var(--shadow-sm)'">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <h4 style="font-size: 14px; font-weight: 800; color: var(--slate-900); line-height: 1.2;">{{ drug.name }}</h4>
                  <span class="badge" [ngClass]="drug.totalStock > drug.reorderThreshold ? 'badge-success' : (drug.totalStock === 0 ? 'badge-danger' : 'badge-warning')">
                    {{ drug.totalStock }} {{ drug.unitOfMeasure }}
                  </span>
                </div>
                <p style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">{{ drug.genericName }}</p>
                <div style="font-size: 11px; color: #0284c7; font-weight: 600; margin-top: 4px;">{{ drug.dosageForm }} • {{ drug.strength }}</div>
                <div *ngIf="drug.prescriptionRequired" style="margin-top: 6px; font-size: 10px; font-weight: 700; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; padding: 2px 6px; display: inline-block;">
                  Rx Prescription Required
                </div>
              </div>

              <div style="margin-top: 12px; border-top: 1px solid var(--slate-100); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 800; color: var(--slate-900); font-family: monospace;">
                  ETB {{ getPrice(drug) | number:'1.2-2' }}
                </span>
                <button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                  <lucide-icon name="plus" [size]="12"></lucide-icon> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: POS Cart Panel -->
        <div class="card" style="padding: 18px; display: flex; flex-direction: column; gap: 14px; position: sticky; top: 80px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
            <h3 style="font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
              <lucide-icon name="shopping-cart" [size]="16" color="#0284c7"></lucide-icon> Cart ({{ cart().length }} items)
            </h3>
            <button *ngIf="cart().length > 0" (click)="clearCart()" class="btn btn-outline" style="padding: 3px 8px; font-size: 11px; color: #ef4444; display: inline-flex; align-items: center; gap: 4px;">
              <lucide-icon name="trash-2" [size]="11"></lucide-icon> Clear
            </button>
          </div>

          <!-- Cart Items List -->
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto;">
            <div *ngFor="let item of cart(); let idx = index" style="padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200);">
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
                <span>{{ item.drugName }}</span>
                <span style="font-family: monospace;">ETB {{ item.unitPrice * item.quantity | number:'1.2-2' }}</span>
              </div>
              <div style="font-size: 11px; color: var(--slate-500);">{{ item.genericName }} • {{ item.unitPrice }} ETB/unit</div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; border-top: 1px solid var(--slate-100); padding-top: 6px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <button (click)="changeQty(idx, -1)" style="width: 24px; height: 24px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700;">-</button>
                  <span style="font-size: 13px; font-weight: 800; width: 26px; text-align: center; font-family: monospace;">{{ item.quantity }}</span>
                  <button (click)="changeQty(idx, 1)" style="width: 24px; height: 24px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700;">+</button>
                </div>
                <button (click)="removeItem(idx)" style="background: none; border: none; color: #ef4444; font-size: 11px; cursor: pointer; font-weight: 600;">Remove</button>
              </div>
            </div>

            <div *ngIf="cart().length === 0" style="text-align: center; color: var(--slate-400); padding: 32px 0; font-size: 13px;">
              Cart is empty. Click medication to add.
            </div>
          </div>

          <!-- Rx Required Input Drawer -->
          <div *ngIf="hasPrescriptionItem()" style="padding: 10px; border-radius: 8px; background: #fffbeb; border: 1px solid #fde68a; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; color: #92400e;">Prescription Rx Required</div>
            <input type="text" [(ngModel)]="prescriptionNumber" placeholder="Rx # e.g. RX-2026-99" class="form-control" style="padding: 6px 10px; font-size: 12px;" />
            <input type="text" [(ngModel)]="doctorName" placeholder="Prescribing Doctor Name" class="form-control" style="padding: 6px 10px; font-size: 12px;" />
          </div>

          <!-- Totals & Checkout -->
          <div style="border-top: 1px solid var(--slate-200); padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--slate-600); margin-bottom: 4px;">
              <span>Subtotal:</span>
              <span style="font-family: monospace; font-weight: 700;">ETB {{ calculateSubtotal() | number:'1.2-2' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: var(--slate-900); margin-bottom: 12px;">
              <span>Total Payable:</span>
              <span style="color: #0284c7; font-family: monospace;">ETB {{ calculateSubtotal() | number:'1.2-2' }}</span>
            </div>

            <button [disabled]="cart().length === 0" (click)="openPaymentModal()" class="btn btn-success" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <lucide-icon name="credit-card" [size]="16"></lucide-icon> Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Payment Checkout -->
    <div *ngIf="showPaymentModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 440px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="credit-card" [size]="20" color="#0284c7"></lucide-icon> Complete POS Payment
          </h3>
          <button (click)="showPaymentModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Payment Tender Method *</label>
            <select [(ngModel)]="paymentMethod" class="form-control">
              <option value="CASH">Cash (Drawer Till)</option>
              <option value="MOBILE_MONEY">Telebirr / CBE Birr</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="CREDIT_ACCOUNT">On-Account / Client Credit</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Amount Tendered / Paid (ETB) *</label>
            <input type="number" [(ngModel)]="paidAmount" min="0" step="5" class="form-control" style="font-size: 20px; font-weight: 800;" />
          </div>

          <!-- Quick Cash Presets -->
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500);">Quick:</span>
            <button *ngFor="let b of [100, 200, 500, 1000]" (click)="paidAmount = b" class="btn btn-outline" style="padding: 3px 8px; font-size: 11px;">{{ b }}</button>
            <button (click)="paidAmount = calculateSubtotal()" class="btn btn-outline" style="padding: 3px 8px; font-size: 11px; color: #0284c7; font-weight: 700;">Exact</button>
          </div>

          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--slate-200); display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--slate-600);">Total Payable:</span>
              <strong>ETB {{ calculateSubtotal() | number:'1.2-2' }}</strong>
            </div>
            <div *ngIf="paymentMethod === 'CASH'" style="display: flex; justify-content: space-between; font-weight: 800; color: #059669; border-top: 1px solid var(--slate-200); padding-top: 6px;">
              <span>Change Due:</span>
              <span>ETB {{ (paidAmount - calculateSubtotal()) > 0 ? (paidAmount - calculateSubtotal() | number:'1.2-2') : '0.00' }}</span>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showPaymentModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="finalizeCheckout()" class="btn btn-primary" style="flex: 2; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              <lucide-icon name="printer" [size]="15"></lucide-icon> Confirm & Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PosComponent implements OnInit {
  searchQuery = '';
  customerType = 'RETAIL';
  selectedCustomerId: number | null = null;
  paymentMethod = 'CASH';
  paidAmount = 0;
  prescriptionNumber = '';
  doctorName = '';

  activeShift: any = null;
  customers: any[] = [];
  drugs = signal<any[]>([]);
  cart = signal<CartItem[]>([]);
  showPaymentModal = signal(false);

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private printService: PrintService,
    private validationService: ValidationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkActiveShift();
    this.loadCustomers();
    this.searchDrugs();
    this.route.queryParams.subscribe(params => {
      if (params['customerId']) {
        this.selectedCustomerId = Number(params['customerId']);
        this.onCustomerSelected();
      }
    });
  }

  checkActiveShift(): void {
    this.http.get<any>(`${environment.apiUrl}/cash/shifts/current`).subscribe({
      next: (res) => this.activeShift = res.data,
      error: () => this.activeShift = null
    });
  }

  loadCustomers(): void {
    this.http.get<any>(`${environment.apiUrl}/customers`).subscribe({
      next: (res) => {
        this.customers = res.data || [];
        if (this.selectedCustomerId) {
          this.onCustomerSelected();
        }
      }
    });
  }

  onCustomerSelected(): void {
    if (this.selectedCustomerId) {
      const found = this.customers.find(c => Number(c.id) === Number(this.selectedCustomerId));
      if (found) {
        this.customerType = found.customerType;
      }
    } else {
      this.customerType = 'RETAIL';
    }
  }

  hasPrescriptionItem(): boolean {
    return this.cart().some(i => i.prescriptionRequired);
  }

  searchDrugs(): void {
    this.http.get<any>(`${environment.apiUrl}/drugs?query=${this.searchQuery}&size=36`).subscribe({
      next: (res) => this.drugs.set(res.data.content || [])
    });
  }

  getPrice(drug: any): number {
    if (drug.name?.includes('Panadol')) return 55;
    if (drug.name?.includes('Zithromax')) return 450;
    return 250;
  }

  addToCart(drug: any): void {
    if (drug.totalStock <= 0) {
      this.notificationService.error(`${drug.name} is currently Out of Stock!`);
      return;
    }

    const current = this.cart();
    const existingIndex = current.findIndex(i => i.drugId === drug.id);
    const price = this.getPrice(drug);

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
        discount: 0,
        prescriptionRequired: drug.prescriptionRequired
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

  calculateSubtotal(): number {
    return this.cart().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  openPaymentModal(): void {
    this.paidAmount = this.calculateSubtotal();
    this.showPaymentModal.set(true);
  }

  finalizeCheckout(): void {
    if (this.cart().length === 0) {
      this.notificationService.warning('Cart is empty. Please add medications before checkout.');
      return;
    }

    const total = this.calculateSubtotal();
    if (!this.validationService.isPositiveNumber(this.paidAmount, true)) {
      this.notificationService.warning('Paid amount must be a non-negative number.');
      return;
    }

    if (this.paymentMethod === 'CASH' && this.paidAmount < total) {
      this.notificationService.warning(`Paid amount (ETB ${this.paidAmount}) is less than total sale amount (ETB ${total}).`);
      return;
    }

    const payload = {
      customerId: this.selectedCustomerId,
      saleType: this.customerType,
      paymentMethod: this.paymentMethod,
      paidAmount: this.paidAmount,
      prescriptionNumber: this.prescriptionNumber,
      doctorName: this.doctorName,
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
        this.cart.set([]);
        this.searchDrugs();
        this.checkActiveShift();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Checkout failed');
      }
    });
  }
}
