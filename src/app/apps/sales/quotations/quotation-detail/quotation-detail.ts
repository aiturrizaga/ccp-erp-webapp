import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmPopoverImports } from '@ui/popover';
import { HlmSelectImports } from '@ui/select';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { salesContacts, salesQuotations, saveQuotation } from '../../sales-state';
import { SalesQuotationStatus, SALES_QUOTATION_STATUS_LABEL, SALES_QUOTATION_STATUS_TONE, Tone } from '@core/models';
import { createSalesOrderFromQuotation } from '../../sales-state';

@Component({
  selector: 'app-quotation-detail',
  imports: [FormsModule, DecimalPipe, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, ...HlmSelectImports, EntityHeader, EmptyState],
  templateUrl: './quotation-detail.html',
})
export class QuotationDetail {
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly quotation = computed(() => salesQuotations().find((q) => q.id === this.id()));
  protected readonly contacts = salesContacts;

  protected readonly canConfirmSale = computed(() => {
    const status = this.quotation()?.status;
    return status === 'sent' || status === 'accepted';
  });

  protected statusLabel(status: SalesQuotationStatus): string {
    return SALES_QUOTATION_STATUS_LABEL[status];
  }

  protected statusTone(status: SalesQuotationStatus): Tone {
    return SALES_QUOTATION_STATUS_TONE[status];
  }

  protected readonly confirmSalePopover = signal<'open' | 'closed'>('closed');
  protected readonly sendEmailPopover = signal<'open' | 'closed'>('closed');
  protected readonly recipientEmail = signal('');
  protected readonly statusOptions: { value: SalesQuotationStatus; label: string }[] = [
    { value: 'draft', label: 'Borrador' },
    { value: 'sent', label: 'Enviada' },
    { value: 'accepted', label: 'Aceptada' },
    { value: 'rejected', label: 'Rechazada' },
    { value: 'expired', label: 'Vencida' },
  ];
  protected readonly statusToString = (value: string): string => this.statusOptions.find((option) => option.value === value)?.label ?? value;

  protected changeStatus(status: string | null | undefined): void {
    if (!status || !this.statusOptions.some((option) => option.value === status)) return;
    const quotation = this.quotation();
    if (!quotation || quotation.status === status) return;
    const nextStatus = status as SalesQuotationStatus;
    saveQuotation({ ...quotation, status: nextStatus });
    toast.success(`Estado actualizado: ${SALES_QUOTATION_STATUS_LABEL[nextStatus]}`);
  }

  protected openSendEmail(): void {
    const quotation = this.quotation();
    const contact = quotation?.contactId ? this.contacts().find((c) => c.id === quotation.contactId) : undefined;
    this.recipientEmail.set(contact?.email ?? '');
    this.sendEmailPopover.set('open');
  }

  protected confirmSale(): void {
    const quotation = this.quotation();
    if (!quotation) return;
    this.confirmSalePopover.set('closed');
    const order = createSalesOrderFromQuotation({
      id: quotation.id,
      number: quotation.number,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      contactId: quotation.contactId,
      currency: quotation.currency,
      total: quotation.total,
      lines: quotation.lines,
    });
    toast.success(`Pedido ${order.number} creado`, { description: quotation.customerName });
    this.router.navigate(['/apps/sales/orders', order.id]);
  }

  protected downloadQuotation(): void {
    const quotation = this.quotation();
    if (!quotation) return;
    const rows = quotation.lines.map((line) => `<tr><td>${this.escapeHtml(line.productCode)} — ${this.escapeHtml(line.description)}</td><td>${line.quantity} ${this.escapeHtml(line.unitOfMeasure)}</td><td>${quotation.currency} ${line.unitPrice.toFixed(2)}</td><td>${quotation.currency} ${(line.quantity * line.unitPrice).toFixed(2)}</td></tr>`).join('');
    const documentHtml = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${this.escapeHtml(quotation.number)}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#172b30}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border-bottom:1px solid #d5e2e3;padding:10px;text-align:left}th{text-align:left;color:#52666b}.total{text-align:right;font-size:18px;font-weight:bold;margin-top:20px}</style></head><body><h1>Cotización ${this.escapeHtml(quotation.number)}</h1><p><strong>Cliente:</strong> ${this.escapeHtml(quotation.customerName)}<br><strong>Emisión:</strong> ${quotation.issuedAt}<br><strong>Vigente hasta:</strong> ${quotation.expiresAt}${quotation.paymentTerms ? `<br><strong>Forma de pago:</strong> ${this.escapeHtml(quotation.paymentTerms)}` : ''}</p><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: ${quotation.currency} ${quotation.total.toFixed(2)}</p>${quotation.notes ? `<p><strong>Observaciones:</strong> ${this.escapeHtml(quotation.notes)}</p>` : ''}</body></html>`;
    const url = URL.createObjectURL(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quotation.number}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Cotización ${quotation.number} descargada`);
  }

  protected sendByEmail(): void {
    const quotation = this.quotation();
    const email = this.recipientEmail().trim();
    if (!quotation || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }
    saveQuotation({ ...quotation, status: quotation.status === 'draft' ? 'sent' : quotation.status });
    this.sendEmailPopover.set('closed');
    toast.success('Cotización enviada por correo', { description: `Destinatario: ${email}` });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
  }
}
