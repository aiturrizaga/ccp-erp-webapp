import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { DocumentAttachments } from '@shared/components/document-attachments/document-attachments';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SUPPLIERS, ITEMS, APPROVALS, GOODS_RECEIPTS } from '@core/mock-data';
import { Attachment, PurchaseInvoice, PurchaseOrder, PurchaseOrderStatus, PURCHASE_ORDER_STATUS_LABEL, Tone } from '@core/models';
import { PurchasingState } from '../../purchasing-state';
import { InvoicingState } from '../../../invoicing/invoicing-state';

const IGV_RATE = 0.18;
const TODAY = '2026-08-23';
const DUE_DATE = '2026-09-22';
const INVOICEABLE_STATUSES: PurchaseOrderStatus[] = ['received', 'closed'];

const STATUS_TONE: Record<PurchaseOrderStatus, Tone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  sent: 'info',
  confirmed: 'info',
  partially_received: 'warning',
  received: 'success',
  invoiced: 'success',
  closed: 'success',
  rejected: 'danger',
};

@Component({
  selector: 'app-purchase-order-detail',
  imports: [RouterLink, DecimalPipe, ...HlmButtonImports, ...HlmCardImports, EntityHeader, ApprovalTimeline, DocumentAttachments, EmptyState],
  templateUrl: './purchase-order-detail.html',
})
export class PurchaseOrderDetail {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);
  private readonly invoicingState = inject(InvoicingState);

  private nextInvoiceSeq = 1;

  readonly id = input.required<string>();

  protected readonly po = computed(() => this.purchasingState.purchaseOrders().find((p) => p.id === this.id()));
  protected readonly approval = computed(() => APPROVALS.find((a) => a.id === this.po()?.approvalId));
  protected readonly receipts = computed(() => GOODS_RECEIPTS.filter((r) => r.purchaseOrderId === this.id()));

  protected readonly attachments = computed<Attachment[]>(() => {
    const po = this.po();
    if (!po) return [];
    return [
      { id: 'a1', name: `cotizacion-${po.number}.pdf`, kind: 'pdf', uploadedBy: 'Jorge Salcedo', uploadedAt: po.issuedAt },
      { id: 'a2', name: `oc-firmada-${po.number}.pdf`, kind: 'pdf', uploadedBy: 'Jorge Salcedo', uploadedAt: po.issuedAt },
    ];
  });

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected statusLabel(status: PurchaseOrderStatus): string {
    return PURCHASE_ORDER_STATUS_LABEL[status];
  }

  protected statusTone(status: PurchaseOrderStatus): Tone {
    return STATUS_TONE[status];
  }

  protected canRegisterInvoice(po: PurchaseOrder): boolean {
    return INVOICEABLE_STATUSES.includes(po.status);
  }

  protected registerInvoice(po: PurchaseOrder): void {
    const subtotal = po.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const taxAmount = Math.round(subtotal * IGV_RATE * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    const seq = this.nextInvoiceSeq++;

    const invoice: PurchaseInvoice = {
      id: `INV-P-${po.id}-${seq}`,
      number: `F001-${String(10000 + seq).padStart(5, '0')}`,
      documentType: 'purchase',
      status: 'issued',
      issuedAt: TODAY,
      dueDate: DUE_DATE,
      currency: po.currency,
      lines: po.lines.map((line) => ({
        description: this.itemLabel(line.itemId),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.quantity * line.unitPrice,
      })),
      subtotal,
      taxAmount,
      total,
      paidAmount: 0,
      outstandingBalance: total,
      supplierId: po.supplierId,
      purchaseOrderId: po.id,
    };

    this.invoicingState.addInvoice(invoice);
    this.router.navigate(['/apps/invoicing/invoices', invoice.id]);
  }
}
