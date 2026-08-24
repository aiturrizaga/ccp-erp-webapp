import { Injectable, signal } from '@angular/core';
import { INVOICES } from '@core/mock-data';
import { Invoice, PaymentMethod } from '@core/models';

export interface InvoicePayment {
  amount: number;
  date: string;
  method: PaymentMethod;
}

/** Mutable in-memory copy of the invoicing fixture so the detail view can record payments without touching the shared fixture array. */
@Injectable({ providedIn: 'root' })
export class InvoicingState {
  readonly invoices = signal<Invoice[]>(INVOICES.map((invoice) => ({ ...invoice })));

  addInvoice(invoice: Invoice): void {
    this.invoices.update((invoices) => [...invoices, invoice]);
  }

  registerPayment(invoiceId: string, payment: InvoicePayment): void {
    this.invoices.update((invoices) =>
      invoices.map((invoice) => {
        if (invoice.id !== invoiceId) return invoice;
        const paidAmount = Math.min(invoice.total, invoice.paidAmount + payment.amount);
        const outstandingBalance = Math.max(0, invoice.total - paidAmount);
        const status = outstandingBalance === 0 ? 'paid' : 'partial';
        return { ...invoice, paidAmount, outstandingBalance, status };
      }),
    );
  }
}
