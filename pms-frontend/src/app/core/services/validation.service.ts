import { Injectable } from '@angular/core';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly PHONE_REGEX = /^\+?[0-9\s\-\(\)]{9,18}$/;
  private readonly USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

  /**
   * Validate Email Address
   */
  isValidEmail(email?: string | null, required: boolean = false): boolean {
    if (!email || email.trim() === '') {
      return !required;
    }
    return this.EMAIL_REGEX.test(email.trim());
  }

  /**
   * Validate Phone Number (supports local 09..., international +251..., +1...)
   */
  isValidPhone(phone?: string | null, required: boolean = true): boolean {
    if (!phone || phone.trim() === '') {
      return !required;
    }
    const cleanDigits = phone.replace(/[\s\-\(\)]/g, '');
    return this.PHONE_REGEX.test(phone.trim()) && cleanDigits.length >= 9 && cleanDigits.length <= 15;
  }

  /**
   * Validate Non-empty string
   */
  isNotEmpty(val?: string | null, minLength: number = 1): boolean {
    return !!val && val.trim().length >= minLength;
  }

  /**
   * Validate Positive Number
   */
  isPositiveNumber(val: any, allowZero: boolean = false): boolean {
    if (val === null || val === undefined || isNaN(Number(val))) return false;
    const num = Number(val);
    return allowZero ? num >= 0 : num > 0;
  }

  /**
   * Validate Supplier
   */
  validateSupplier(supplier: {
    name?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
    paymentTermsDays?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (!this.isNotEmpty(supplier.name, 2)) {
      errors.push('Supplier / Company name must be at least 2 characters.');
    }
    if (!this.isValidPhone(supplier.phone, true)) {
      errors.push('Please provide a valid phone number (e.g. +251-911-000000 or 0911000000).');
    }
    if (supplier.email && !this.isValidEmail(supplier.email, false)) {
      errors.push('Invalid supplier email address format (e.g. orders@company.com).');
    }
    if (supplier.paymentTermsDays !== undefined && !this.isPositiveNumber(supplier.paymentTermsDays, true)) {
      errors.push('Payment terms days must be 0 or greater.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Customer / Client
   */
  validateCustomer(customer: {
    name?: string;
    phone?: string;
    email?: string;
    creditLimit?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (!this.isNotEmpty(customer.name, 2)) {
      errors.push('Customer or organization name is required.');
    }
    if (!this.isValidPhone(customer.phone, true)) {
      errors.push('Please enter a valid phone number (e.g. +251-911-000000).');
    }
    if (customer.email && !this.isValidEmail(customer.email, false)) {
      errors.push('Invalid customer email address format.');
    }
    if (customer.creditLimit !== undefined && !this.isPositiveNumber(customer.creditLimit, true)) {
      errors.push('Credit limit must be a positive number or zero.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Staff / User
   */
  validateUser(user: {
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
    roles?: string[];
  }, isEdit: boolean = false): ValidationResult {
    const errors: string[] = [];

    if (!this.isNotEmpty(user.fullName, 2)) {
      errors.push('Full name must be at least 2 characters.');
    }
    if (!user.username || !this.USERNAME_REGEX.test(user.username.trim())) {
      errors.push('Username must be 3-30 characters and contain only letters, numbers, hyphens, or underscores.');
    }
    if (!this.isValidEmail(user.email, true)) {
      errors.push('Please enter a valid work email address (e.g. staff@pharmacy.com).');
    }
    if (user.phone && !this.isValidPhone(user.phone, false)) {
      errors.push('Invalid phone number format.');
    }
    if (!isEdit) {
      if (!user.password || user.password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
      }
    } else if (user.password && user.password.length > 0 && user.password.length < 6) {
      errors.push('New password must be at least 6 characters long.');
    }
    if (!user.roles || user.roles.length === 0) {
      errors.push('Please assign at least one role to the staff member.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Drug Catalog Item
   */
  validateDrug(drug: {
    name?: string;
    genericName?: string;
    categoryId?: number | null;
    dosageForm?: string;
    unitOfMeasure?: string;
    reorderThreshold?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (!this.isNotEmpty(drug.name, 2)) {
      errors.push('Brand drug name is required.');
    }
    if (!this.isNotEmpty(drug.genericName, 2)) {
      errors.push('Generic formulation / chemical name is required.');
    }
    if (!drug.categoryId) {
      errors.push('Please select a pharmaceutical category.');
    }
    if (!drug.dosageForm) {
      errors.push('Please select a dosage form (e.g. TABLET, CAPSULE, SYRUP).');
    }
    if (!this.isPositiveNumber(drug.reorderThreshold, true)) {
      errors.push('Reorder threshold must be 0 or greater.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate FEFO Batch Intake
   */
  validateBatch(batch: {
    drugId?: number | null;
    batchNumber?: string;
    expiryDate?: string;
    quantityOnHand?: number;
    buyingPrice?: number;
    retailPrice?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (!batch.drugId) {
      errors.push('Please select a target catalog medication.');
    }
    if (!this.isNotEmpty(batch.batchNumber, 2)) {
      errors.push('Batch / Lot number is required (e.g. BATCH-2026-01).');
    }
    if (!batch.expiryDate) {
      errors.push('Expiry date is mandatory for FEFO inventory.');
    } else {
      const exp = new Date(batch.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (exp <= today) {
        errors.push('Expiry date must be in the future.');
      }
    }
    if (!this.isPositiveNumber(batch.quantityOnHand, false)) {
      errors.push('Batch quantity received must be greater than 0.');
    }
    if (!this.isPositiveNumber(batch.buyingPrice, false)) {
      errors.push('Buying / cost price must be greater than 0.');
    }
    if (!this.isPositiveNumber(batch.retailPrice, false)) {
      errors.push('Retail selling price must be greater than 0.');
    }
    if (batch.buyingPrice && batch.retailPrice && Number(batch.retailPrice) < Number(batch.buyingPrice)) {
      errors.push('Retail price cannot be lower than buying cost price.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Purchase Order
   */
  validatePurchaseOrder(po: {
    supplierId?: number | null;
    items: Array<{ drugId?: number | null; quantity?: number; unitCost?: number }>;
  }): ValidationResult {
    const errors: string[] = [];

    if (!po.supplierId) {
      errors.push('Please select a pharmaceutical vendor.');
    }
    if (!po.items || po.items.length === 0) {
      errors.push('Please add at least one line item to the purchase order.');
    } else {
      po.items.forEach((item, idx) => {
        if (!item.drugId) {
          errors.push(`Item #${idx + 1}: Please select a medication.`);
        }
        if (!this.isPositiveNumber(item.quantity, false)) {
          errors.push(`Item #${idx + 1}: Quantity must be at least 1.`);
        }
        if (!this.isPositiveNumber(item.unitCost, false)) {
          errors.push(`Item #${idx + 1}: Unit cost must be greater than 0.`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Cash Drawer Transaction
   */
  validateCashTransaction(tx: {
    amount?: number;
    category?: string;
    reason?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!this.isPositiveNumber(tx.amount, false)) {
      errors.push('Transaction amount must be greater than 0.');
    }
    if (!this.isNotEmpty(tx.category, 2)) {
      errors.push('Please select or specify an expense/deposit category.');
    }
    if (!this.isNotEmpty(tx.reason, 3)) {
      errors.push('Please provide a descriptive reason for audit records.');
    }

    return { valid: errors.length === 0, errors };
  }
}
