import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmAlertDialogImports } from '@ui/alert-dialog';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { DocumentAttachments } from '@shared/components/document-attachments/document-attachments';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SUPPLIERS, ITEMS, APPROVALS, WORK_SHEETS } from '@core/mock-data';
import {
  Attachment,
  GoodsReceiptStatus,
  GOODS_RECEIPT_STATUS_LABEL,
  PurchaseInvoice,
  PurchaseOrder,
  PurchaseOrderStatus,
  PURCHASE_ORDER_STATUS_LABEL,
  Tone,
} from '@core/models';
import { AuthState } from '@shell/auth-state';
import { PurchasingState } from '../../purchasing-state';
import { InvoicingState } from '../../../invoicing/invoicing-state';
import { WarehouseOpsState } from '../../../inventory/warehouse-ops-state';

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

const RECEIPT_STATUS_TONE: Record<GoodsReceiptStatus, Tone> = {
  scheduled: 'neutral',
  in_progress: 'info',
  partial: 'warning',
  received: 'success',
  with_discrepancies: 'danger',
  in_claim: 'danger',
  closed: 'success',
};

@Component({
  selector: 'app-purchase-order-detail',
  imports: [
    FormsModule,
    RouterLink,
    DecimalPipe,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmAlertDialogImports,
    EntityHeader,
    ApprovalTimeline,
    DocumentAttachments,
    EmptyState,
    StatusBadge,
  ],
  templateUrl: './purchase-order-detail.html',
})
export class PurchaseOrderDetail {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);
  private readonly invoicingState = inject(InvoicingState);
  private readonly warehouseOpsState = inject(WarehouseOpsState);
  protected readonly auth = inject(AuthState);

  private nextInvoiceSeq = 1;

  readonly id = input.required<string>();

  protected readonly po = computed(() => this.purchasingState.purchaseOrders().find((p) => p.id === this.id()));
  protected readonly approval = computed(() => APPROVALS.find((a) => a.id === this.po()?.approvalId));
  protected readonly receipts = computed(() => this.warehouseOpsState.goodsReceipts().filter((r) => r.purchaseOrderId === this.id()));

  // --- Traceability: HT → Solicitud → Cotización → esta OC → Recepciones → Factura(s) ---
  protected readonly quotation = computed(() => this.purchasingState.quotations().find((q) => q.id === this.po()?.quotationId));
  protected readonly requisition = computed(() => this.purchasingState.requisitions().find((r) => r.id === this.quotation()?.requisitionId));
  protected readonly workSheetId = computed(() => WORK_SHEETS.find((ws) => ws.number === this.requisition()?.workSheetRef)?.id);
  protected readonly invoices = computed(() =>
    this.invoicingState.invoices().filter((inv): inv is PurchaseInvoice => inv.documentType === 'purchase' && inv.purchaseOrderId === this.id()),
  );

  protected readonly pendingLines = computed(() => (this.po()?.lines ?? []).filter((line) => line.quantity - line.receivedQuantity > 0));

  protected readonly followUpDate = signal('');
  protected readonly followUpTime = signal('09:00');

  protected openFollowUpDraft(): void {
    this.followUpDate.set('');
    this.followUpTime.set('09:00');
  }

  protected canScheduleFollowUp(): boolean {
    return this.followUpDate().length > 0 && this.followUpTime().length > 0;
  }

  protected confirmScheduleFollowUp(): void {
    const po = this.po();
    if (!po || !this.canScheduleFollowUp()) return;
    const receipt = this.warehouseOpsState.scheduleFollowUpReceipt(po, this.followUpDate(), this.followUpTime());
    if (receipt) {
      toast.success(`Recepción del saldo programada — ${receipt.number}`);
      this.router.navigate(['/apps/inventory/goods-receipt', receipt.id]);
    }
  }

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

  protected receiptStatusLabel(status: GoodsReceiptStatus): string {
    return GOODS_RECEIPT_STATUS_LABEL[status];
  }

  protected receiptStatusTone(status: GoodsReceiptStatus): Tone {
    return RECEIPT_STATUS_TONE[status];
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
    toast.success(`Factura ${invoice.number} registrada`, { description: `${po.currency} ${total.toFixed(2)}` });
    this.router.navigate(['/apps/invoicing/invoices', invoice.id]);
  }
}
