import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  printThermalReceipt(receiptData?: any): void {
    window.print();
  }

  printA4Invoice(invoiceData?: any): void {
    window.print();
  }
}
