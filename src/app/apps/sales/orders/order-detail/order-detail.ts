import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmCheckboxImports } from '@ui/checkbox';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { SALES_ORDER_WORK_SHEET_TYPE_LABEL, SalesOrderWorkSheetType, SalesOrderStatus, SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, PAYMENT_GATE_STATUS_LABEL, PAYMENT_GATE_STATUS_TONE, PAYMENT_METHOD_LABEL, PaymentMethod, SalesInvoice, Tone, workSheetStatus, WORK_SHEET_STATUS_LABEL, SalesOrderCustomerDocumentType, SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL, SalesOrderCustomerDocument, SalesOrderAdvancePayment } from '@core/models';
import { acceptSalesOrderWorkSheet, createDispatchRelease, markProductionReady, registerAdvancePayment, salesClaims, salesContacts, salesDispatchReleases, salesOrders, salesQuotations, saveOrder } from '../../sales-state';
import { ProductionState } from '../../../production/production-state';
import { InvoicingState } from '../../../finance/invoicing-state';
import { OrderTimelineComponent, OrderTimelineEvent } from './order-timeline';

const RELATED_DOC_ICON: Record<string, string> = {
  cotizacion: 'tablerFileText',
  hoja_trabajo: 'tablerClipboardText',
  guia: 'tablerRoute',
  factura: 'tablerReceipt2',
  voucher: 'tablerCashBanknote',
  otro: 'tablerFile',
  reclamo: 'tablerAlertTriangle',
};

interface RelatedDocRow {
  id: string;
  icon: string;
  label: string;
  number?: string;
  date?: string;
  description?: string;
  fileName?: string;
  url?: string;
  link?: string;
  /** True cuando el documento es una cotización de venta (link al detalle + botón PDF solo visual). */
  isQuotation?: boolean;
}

/** Documento seleccionado para el visor / descarga. */
interface OrderDocView {
  title: string;
  subtitle?: string;
  name?: string;
  mimeType?: string;
  url?: string;
}

@Component({
  selector: 'app-order-detail',
  imports: [FormsModule, RouterLink, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmDialogImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmCheckboxImports, EmptyState, StatusBadge, OrderTimelineComponent],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly invoicingState = inject(InvoicingState);
  private readonly productionState = inject(ProductionState);
  readonly id = input.required<string>();
  protected readonly order = computed(() => salesOrders().find(o => o.id === this.id()));
  protected readonly quotation = computed(() => salesQuotations().find((q) => q.id === this.order()?.quotationId));
  protected readonly actionPopover = signal<string | null>(null);
  protected readonly activeTab = signal<'general' | 'products' | 'advances' | 'documents' | 'notes' | 'history'>('general');
  protected readonly flowSteps = [
    'Pedido confirmado',
    'HT aceptada por Producción',
    'Producción terminada',
    'Ventas verifica',
    'Listo para despacho',
    'Despacho',
    'Facturación',
  ];
  protected readonly totalQuantity = computed(() => this.order()?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0);
  protected readonly advancePercent = computed(() => {
    const o = this.order();
    if (!o?.total) return 0;
    return Math.min(100, Math.max(0, ((o.paymentGate?.advancePayment?.amount ?? 0) / o.total) * 100));
  });
  protected statusLabel = (s: SalesOrderStatus) => SALES_ORDER_STATUS_LABEL[s];
  protected statusTone = (s: SalesOrderStatus): Tone => SALES_ORDER_STATUS_TONE[s];
  protected readonly statusOptions = (Object.keys(SALES_ORDER_STATUS_LABEL) as SalesOrderStatus[]).map((value) => ({ value, label: SALES_ORDER_STATUS_LABEL[value] }));
  protected readonly customerDocTypeOptions = (Object.keys(SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL) as SalesOrderCustomerDocumentType[]).map((value) => ({ value, label: SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL[value] }));
  protected readonly newCustomerDocModal = signal<'open' | 'closed'>('closed');
  protected readonly newDocType = signal<SalesOrderCustomerDocumentType>('purchase_order');
  protected readonly newDocReference = signal('');
  protected readonly newDocDescription = signal('');
  protected readonly newDocFile = signal<{ name: string; uploadedAt: string; mimeType?: string; url?: string } | null>(null);
  protected readonly internalNotes = signal('');
  protected readonly workSheetType = signal<SalesOrderWorkSheetType>('regular');
  protected readonly SALES_ORDER_WORK_SHEET_TYPE_LABEL = SALES_ORDER_WORK_SHEET_TYPE_LABEL;
  protected readonly workSheetTypeOptions = (Object.keys(SALES_ORDER_WORK_SHEET_TYPE_LABEL) as SalesOrderWorkSheetType[]).map((value) => ({ value, label: SALES_ORDER_WORK_SHEET_TYPE_LABEL[value] }));
  protected readonly workSheetModal = signal<'open' | 'closed'>('closed');
  protected readonly dispatchReleaseModal = signal<'open' | 'closed'>('closed');
  protected readonly selectedWorkSheetIds = signal<Set<string>>(new Set());
  protected readonly advanceAmount = signal(0);
  protected readonly advanceDate = signal('2026-09-01');
  protected readonly advanceMethod = signal<PaymentMethod>('transfer');
  protected readonly advanceVoucherFile = signal<{ name: string; uploadedAt: string; mimeType?: string; url?: string } | null>(null);
  protected readonly paymentMethodOptions = (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((value) => ({ value, label: PAYMENT_METHOD_LABEL[value] }));
  protected methodLabel = (m: PaymentMethod) => PAYMENT_METHOD_LABEL[m];
  protected readonly paymentGateStatusLabel = (status: keyof typeof PAYMENT_GATE_STATUS_LABEL) => PAYMENT_GATE_STATUS_LABEL[status];
  protected readonly paymentGateStatusTone = (status: keyof typeof PAYMENT_GATE_STATUS_TONE): Tone => PAYMENT_GATE_STATUS_TONE[status];

  constructor() {
    effect(() => {
      const order = this.order();
      if (!order) return;
      this.internalNotes.set(order.internalNotes ?? '');
      const gate = order.paymentGate;
      const requiredAdvance = gate ? Math.round(order.total * gate.advancePct) / 100 : 0;
      this.advanceAmount.set(gate?.advancePayment?.amount ?? requiredAdvance);
      this.advanceDate.set(gate?.advancePayment?.date ?? '2026-09-01');
      this.advanceMethod.set(gate?.advancePayment?.method ?? 'transfer');
      this.advanceVoucherFile.set(gate?.advancePayment?.voucher ?? null);
    });
  }

  protected readonly paymentCleared = computed(() => {
    const o = this.order();
    return !!o && (!o.paymentGate || o.paymentGate.status === 'not_required' || o.paymentGate.status === 'validated');
  });

  protected contactName(contactId?: string): string {
    if (!contactId) return '—';
    return salesContacts().find((c) => c.id === contactId)?.name ?? contactId;
  }
  protected readonly editingDeliveryAddress = signal(false);
  protected readonly deliveryAddressDraft = signal('');
  protected startEditDeliveryAddress(current?: string): void {
    this.deliveryAddressDraft.set(current ?? '');
    this.editingDeliveryAddress.set(true);
  }
  protected cancelEditDeliveryAddress(): void {
    this.editingDeliveryAddress.set(false);
  }
  protected saveDeliveryAddress(): void {
    const order = this.order();
    if (!order || !this.deliveryAddressDraft().trim()) return;
    saveOrder({ ...order, deliveryAddress: this.deliveryAddressDraft().trim() });
    this.editingDeliveryAddress.set(false);
    toast.success('Dirección de entrega actualizada');
  }

  protected readonly existingWorkSheets = computed(() => {
    const o = this.order();
    if (!o || !this.paymentCleared()) return [];
    const ids = o.workSheetIds?.length ? o.workSheetIds : (o.workSheetId ? [o.workSheetId] : []);
    return ids.map((id) => this.productionState.workSheets().find((ws) => ws.id === id)).filter(Boolean);
  });

  protected readonly releasedWorkSheetIds = computed(() => {
    const orderId = this.order()?.id;
    if (!orderId) return new Set<string>();
    return new Set(salesDispatchReleases().filter((r) => r.salesOrderId === orderId).flatMap((r) => r.workSheetIds));
  });
  protected readonly canReleaseForDispatch = computed(() => this.order()?.status === 'production_ready' && this.existingWorkSheets().length > 0);

  /** Una HT puede ser seleccionada para despacho si no fue liberada y (está completada O el pedido está en producción lista). */
  protected canReleaseWorkSheet(ws: import('@core/models').WorkSheet): boolean {
    if (this.releasedWorkSheetIds().has(ws.id)) return false;
    return workSheetStatus(ws) === 'completed' || this.order()?.status === 'production_ready';
  }

  protected readonly canManageFlow = computed(() => this.paymentCleared() && this.order()?.status !== 'cancelled');
  protected readonly canCreateWorkSheet = computed(() => {
    const o = this.order();
    return !!o && this.canManageFlow() && !['cancelled', 'pending_payment'].includes(o.status) && o.lines.length > 0;
  });
  protected readonly advanceCount = computed(() => this.order()?.paymentGate?.advancePayment ? 1 : 0);
  protected readonly documentCount = computed(() => (this.order()?.relatedDocuments?.length ?? 0) + (this.order()?.customerDocuments?.length ?? 0));
  protected readonly notesCount = computed(() => this.order()?.internalNotes?.trim() ? 1 : 0);
  protected readonly customerDocumentRows = computed(() => (this.order()?.customerDocuments ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  protected readonly orderClaims = computed(() => {
    const o = this.order();
    if (!o) return [];
    return salesClaims().filter((c) => o.claimIds?.includes(c.id));
  });
  protected customerDocTypeLabel = (t: SalesOrderCustomerDocumentType) => SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL[t];

  /** Documentos internos (cotizaciones, HT, guías, facturas, reclamos…) en una sola lista ordenable. */
  protected readonly relatedDocRows = computed<RelatedDocRow[]>(() => {
    const o = this.order();
    if (!o) return [];
    const rows: RelatedDocRow[] = (o.relatedDocuments ?? []).map((d) => ({
      id: d.id,
      icon: RELATED_DOC_ICON[d.type] ?? 'tablerFile',
      label: d.label,
      number: d.number,
      date: d.date,
      fileName: d.fileName,
      url: d.url,
      link: d.type === 'cotizacion' && d.number ? `/apps/sales/quotations/${d.number}` : undefined,
      isQuotation: d.type === 'cotizacion',
    }));
    for (const c of this.orderClaims()) {
      rows.push({
        id: c.id,
        icon: RELATED_DOC_ICON['reclamo'],
        label: 'Reclamo registrado',
        number: c.number,
        date: c.createdAt,
        description: c.description,
        link: `/apps/sales/claims/${c.id}`,
      });
    }
    return rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  });

  protected readonly documentViewerModal = signal<'open' | 'closed'>('closed');
  protected readonly viewerDoc = signal<OrderDocView | null>(null);

  protected openDocViewer(view: OrderDocView): void {
    this.viewerDoc.set(view);
    this.documentViewerModal.set('open');
  }

  protected relatedDocView(row: RelatedDocRow): OrderDocView {
    return {
      title: `${row.label}${row.number ? ` · ${row.number}` : ''}`,
      subtitle: `${row.description ?? ''}${row.date ? `${row.description ? ' · ' : ''}${row.date}` : ''}` || undefined,
      name: row.fileName,
      url: row.url,
    };
  }

  protected openAdvanceVoucherPreview(payment: SalesOrderAdvancePayment): void {
    this.openDocViewer({
      title: 'Voucher del adelanto',
      subtitle: `${this.order()?.currency ?? ''} ${payment.amount.toFixed(2)} · ${payment.date}`,
      name: payment.voucher.name,
      mimeType: payment.voucher.mimeType,
      url: payment.voucher.url,
    });
  }

  protected customerDocView(doc: SalesOrderCustomerDocument): OrderDocView {
    return {
      title: this.customerDocTypeLabel(doc.type),
      subtitle: doc.description,
      name: doc.file?.name,
      mimeType: doc.file?.mimeType,
      url: doc.file?.url,
    };
  }

  protected downloadDoc(name?: string, url?: string): void {
    if (!name || !url) { toast.error('Este documento no tiene archivo adjunto para descargar'); return; }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  /** Descarga del PDF de cotización: por ahora solo un botón visible (pendiente de generación del PDF). */
  protected downloadQuotationPdf(): void {
    toast.info('La descarga del PDF de la cotización estará disponible próximamente.');
  }
  protected readonly currentFlowStep = computed(() => {
    const status = this.order()?.status;
    const indexByStatus: Partial<Record<SalesOrderStatus, number>> = {
      confirmed: 1,
      preparing: 2,
      production_ready: 4,
      ready_for_dispatch: 5,
      partially_dispatched: 5,
      dispatched: 6,
      finished: 6,
      invoiced: 7,
      pending_payment: 2,
    };
    return status ? (indexByStatus[status] ?? 1) : 1;
  });

  /** Todos los movimientos de la orden, ordenados cronológicamente (de la cotización a la entrega). */
  protected readonly orderTimeline = computed<OrderTimelineEvent[]>(() => {
    const o = this.order();
    if (!o) return [];
    const events: OrderTimelineEvent[] = [];

    const quote = this.quotation();
    if (quote) events.push({ date: quote.issuedAt, kind: 'quotation', title: 'Cotización creada', detail: quote.number });

    if (o.confirmedAt) events.push({ date: o.confirmedAt, kind: 'order', title: 'Pedido confirmado', detail: o.number });

    const advance = o.paymentGate?.advancePayment;
    if (advance?.registeredAt) events.push({ date: advance.registeredAt, kind: 'advance', title: 'Adelanto registrado', detail: `${o.currency} ${advance.amount.toFixed(2)} · ${this.methodLabel(advance.method)}`, user: advance.registeredBy });
    if (advance?.validatedAt) events.push({ date: advance.validatedAt, kind: 'advance', title: 'Adelanto validado por Cobranzas', user: advance.validatedBy });
    if (advance?.reviewedAt) events.push({ date: advance.reviewedAt, kind: 'advance', title: 'Adelanto revisado por Cobranzas', user: advance.reviewedBy });

    const docs = o.relatedDocuments ?? [];
    let hasWorksheetEvent = false;
    for (const doc of docs) {
      if (doc.type === 'hoja_trabajo' && doc.date) {
        events.push({ date: doc.date, kind: 'work_sheet', title: 'Hoja de trabajo creada', detail: doc.number });
        hasWorksheetEvent = true;
      }
    }
    if (!hasWorksheetEvent) {
      for (const ws of this.existingWorkSheets()) {
        if (ws?.scheduledDate) events.push({ date: ws.scheduledDate, kind: 'work_sheet', title: 'Hoja de trabajo creada', detail: ws.number });
      }
    }

    const releases = salesDispatchReleases().filter((r) => r.salesOrderId === o.id);
    if (o.readyForDispatchAt && releases.length === 0) events.push({ date: o.readyForDispatchAt, kind: 'release', title: 'Listo para despacho', detail: o.number });
    for (const release of releases) events.push({ date: release.releasedAt, kind: 'release', title: 'HT liberadas para despacho', detail: `${release.workSheetIds.length} HT`, user: release.releasedBy });

    if (o.dispatchedAt) events.push({ date: o.dispatchedAt, kind: 'dispatch', title: 'Despacho registrado', detail: o.number });

    for (const guide of this.invoicingState.guides().filter((g) => g.salesOrderId === o.id)) {
      events.push({ date: guide.issuedAt, kind: 'guide', title: 'Guía de remisión emitida', detail: guide.number });
    }

    for (const invoice of this.invoicingState.invoices().filter((i) => i.documentType === 'sales' && i.salesOrderId === o.id)) {
      events.push({ date: invoice.issuedAt, kind: 'invoice', title: 'Factura emitida', detail: invoice.number });
    }

    for (const claim of salesClaims().filter((c) => o.claimIds?.includes(c.id))) {
      events.push({ date: claim.createdAt, kind: 'claim', title: 'Reclamo registrado', detail: claim.number });
    }

    for (const doc of docs) {
      if (doc.date && !['cotizacion', 'hoja_trabajo', 'guia', 'factura', 'voucher'].includes(doc.type)) {
        events.push({ date: doc.date, kind: 'other', title: doc.label, detail: doc.number });
      }
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  });

  protected selectTab(tab: 'general' | 'products' | 'advances' | 'documents' | 'notes' | 'history'): void {
    this.activeTab.set(tab);
  }

  protected openAdvanceDialog(): void {
    const o = this.order();
    const gate = o?.paymentGate;
    const requiredAdvance = gate ? Math.round(o!.total * gate.advancePct) / 100 : 0;
    this.advanceAmount.set(gate?.advancePayment?.amount ?? requiredAdvance);
    this.advanceDate.set(gate?.advancePayment?.date ?? '2026-09-01');
    this.advanceMethod.set(gate?.advancePayment?.method ?? 'transfer');
    this.advanceVoucherFile.set(gate?.advancePayment?.voucher ?? null);
  }

  protected readonly requiredAdvanceAmount = computed(() => {
    const o = this.order();
    return o?.paymentGate ? Math.round(o.total * o.paymentGate.advancePct) / 100 : 0;
  });
  protected readonly canSubmitAdvance = computed(() => {
    const o = this.order();
    return !!o?.paymentGate && ['pending_docs', 'observed'].includes(o.paymentGate.status) && this.advanceAmount() >= this.requiredAdvanceAmount() && this.advanceAmount() <= (o?.total ?? 0) && !!this.advanceVoucherFile() && !!this.advanceDate() && !!this.advanceMethod();
  });

  protected onAdvanceVoucherFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('El voucher debe ser una imagen o PDF');
      return;
    }
    this.advanceVoucherFile.set({
      name: file.name,
      uploadedAt: new Date().toISOString(),
      mimeType: file.type,
      url: URL.createObjectURL(file),
    });
  }

  protected clearAdvanceVoucher(): void {
    const current = this.advanceVoucherFile();
    if (current?.url?.startsWith('blob:')) URL.revokeObjectURL(current.url);
    this.advanceVoucherFile.set(null);
  }

  protected saveAdvance(): void {
    const order = this.order();
    const voucher = this.advanceVoucherFile();
    if (!order || !voucher || !this.canSubmitAdvance()) return;
    const ok = registerAdvancePayment(order.id, {
      amount: this.advanceAmount(),
      date: this.advanceDate(),
      method: this.advanceMethod(),
      voucher,
      registeredBy: 'Ventas',
    });
    if (ok) toast.success('Adelanto enviado a Cobranzas', { description: `${order.number} quedó pendiente de validación del voucher.` });
  }

  protected saveInternalNotes(): void {
    const order = this.order();
    if (!order) return;
    saveOrder({ ...order, internalNotes: this.internalNotes().trim() || undefined });
    toast.success('Notas internas actualizadas');
  }

  protected createWorkSheet(): void {
    const order = this.order();
    if (!order || !this.canCreateWorkSheet()) return;
    const ws = this.productionState.createWorkSheetFromSalesOrder({
      salesOrderId: order.id,
      salesOrderNumber: order.number,
      customerName: order.customerName,
      committedDate: order.committedDeliveryDate,
      internalNotes: this.internalNotes().trim() || order.internalNotes,
      type: this.workSheetType(),
      lines: order.lines.map((line) => {
        const salesProduct = line.salesProductId ? this.productionState.products().find((p) => p.code === line.productCode) : undefined;
        return {
          productId: salesProduct?.id ?? '',
          quantity: line.quantity,
          unitOfMeasure: line.unitOfMeasure,
          description: line.description,
        };
      }),
    });
    const workSheetIds = [...new Set([...(order.workSheetIds ?? []), ...(order.workSheetId ? [order.workSheetId] : []), ws.id])];
    const relatedDocuments = [
      ...(order.relatedDocuments ?? []),
      { id: `DOC-${order.id}-HT-${ws.id}`, type: 'hoja_trabajo' as const, label: SALES_ORDER_WORK_SHEET_TYPE_LABEL[this.workSheetType()], number: ws.number, date: new Date().toISOString().slice(0, 10) },
    ];
    saveOrder({ ...order, workSheetId: order.workSheetId ?? ws.id, workSheetIds, relatedDocuments, internalNotes: this.internalNotes().trim() || order.internalNotes });
    this.workSheetModal.set('closed');
    toast.success(`${ws.number} creada`, { description: `${SALES_ORDER_WORK_SHEET_TYPE_LABEL[this.workSheetType()]} · vinculada a ${order.number}` });
    this.router.navigate(['/apps/production/work-sheets', ws.id]);
  }

  protected canAccept = computed(() => this.order()?.status === 'confirmed' && !!this.order()?.workSheetId);
  protected canInvoice = computed(() => ['dispatched','finished'].includes(this.order()?.status ?? ''));

  protected acceptProduction(): void { const o=this.order(); if(!o)return; acceptSalesOrderWorkSheet(o.id); this.actionPopover.set(null); toast.success(`${o.number}: HT aceptada por Producción`); }
  protected notifyReady(): void { const o=this.order(); if(!o)return; markProductionReady(o.id); this.actionPopover.set(null); toast.success(`${o.number}: Producción indicó que está lista para verificación`); }

  protected openDispatchReleaseDialog(): void {
    this.selectedWorkSheetIds.set(new Set());
    this.dispatchReleaseModal.set('open');
  }

  protected toggleWorkSheetForDispatch(id: string, checked: boolean): void {
    const next = new Set(this.selectedWorkSheetIds());
    if (checked) next.add(id); else next.delete(id);
    this.selectedWorkSheetIds.set(next);
  }

  protected releaseSelectedWorkSheets(): void {
    const order = this.order();
    const ids = [...this.selectedWorkSheetIds()];
    if (!order || !ids.length || !this.canReleaseForDispatch()) return;
    const release = createDispatchRelease({
      salesOrderId: order.id,
      salesOrderNumber: order.number,
      customerId: order.customerId,
      customerName: order.customerName,
      workSheetIds: ids,
      releasedBy: 'Ventas',
    });
    if (!release) return;
    this.dispatchReleaseModal.set('closed');
    this.selectedWorkSheetIds.set(new Set());
    toast.success('HT liberadas para despacho', { description: `${ids.length} HT${ids.length === 1 ? '' : 's'} de ${order.number} quedaron disponibles para Despacho.` });
  }

  protected workSheetStatusLabel(ws: import('@core/models').WorkSheet): string {
    return WORK_SHEET_STATUS_LABEL[workSheetStatus(ws)];
  }

  protected workSheetStatus(ws: import('@core/models').WorkSheet): import('@core/models').WorkSheetStatus {
    return workSheetStatus(ws);
  }

  protected statusToString = (value: string): string => this.statusOptions.find((option) => option.value === value)?.label ?? value;
  protected workSheetTypeToString = (value: string): string => this.workSheetTypeOptions.find((option) => option.value === value)?.label ?? value;
  protected changeStatus(status: string | null | undefined): void {
    if (!status || !this.statusOptions.some((option) => option.value === status)) return;
    const order = this.order();
    if (!order || order.status === status) return;
    if (!this.canManageFlow()) {
      toast.info('El pedido está bloqueado hasta validar el adelanto en Cobranzas.');
      return;
    }
    const nextStatus = status as SalesOrderStatus;
    saveOrder({ ...order, status: nextStatus });
    toast.success(`Estado actualizado: ${SALES_ORDER_STATUS_LABEL[nextStatus]}`);
  }

  protected readonly canSubmitNewCustomerDoc = computed(() => this.newDocReference().trim().length > 0);
  protected customerDocTypeToString = (value: string): string => this.customerDocTypeOptions.find((option) => option.value === value)?.label ?? value;

  protected openNewCustomerDocDialog(): void {
    this.newDocType.set('purchase_order');
    this.newDocReference.set('');
    this.newDocDescription.set('');
    this.newDocFile.set(null);
    this.newCustomerDocModal.set('open');
  }

  protected onNewDocFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.newDocFile.set({ name: file.name, uploadedAt: new Date().toISOString(), mimeType: file.type, url: URL.createObjectURL(file) });
  }

  protected clearNewDocFile(): void {
    const current = this.newDocFile();
    if (current?.url?.startsWith('blob:')) URL.revokeObjectURL(current.url);
    this.newDocFile.set(null);
  }

  protected saveNewCustomerDoc(): void {
    const order = this.order();
    if (!order) return;
    const reference = this.newDocReference().trim();
    if (!reference) { toast.error('Ingresa la referencia del documento'); return; }
    const description = this.newDocDescription().trim();
    const file = this.newDocFile();
    const isPurchaseOrder = this.newDocType() === 'purchase_order';
    const doc: SalesOrderCustomerDocument = {
      id: `CUST-DOC-${order.id}-${Date.now()}`,
      type: this.newDocType(),
      reference,
      description: description || undefined,
      file: file ? { name: file.name, uploadedAt: file.uploadedAt, mimeType: file.mimeType, url: file.url } : undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    saveOrder({
      ...order,
      customerDocuments: [...(order.customerDocuments ?? []), doc],
      customerOrderDocumentType: isPurchaseOrder ? 'purchase_order' : order.customerOrderDocumentType,
      customerOrderDocumentNumber: isPurchaseOrder && reference ? reference : order.customerOrderDocumentNumber,
      customerOrderDocument: isPurchaseOrder && file ? { ...doc.file!, type: 'customer_purchase_order' } : order.customerOrderDocument,
    });
    this.newCustomerDocModal.set('closed');
    toast.success('Documento del cliente agregado');
  }

  protected addGuide(): void {
    const o=this.order(); if(!o)return;
    const next=(o.relatedDocuments?.filter(d=>d.type==='guia').length ?? 0)+1;
    saveOrder({...o, relatedDocuments:[...(o.relatedDocuments??[]),{id:`DOC-${o.id}-G${next}`,type:'guia',label:'Guía de remisión',number:`GR-2026-${String(next).padStart(4,'0')}`,date:'2026-09-01'}]});
    toast.success('Guía registrada');
  }

  protected issueInvoice(): void {
    const order=this.order(); if(!order)return;
    const taxRate=.18, subtotal=order.total, taxAmount=Math.round(subtotal*taxRate*100)/100, total=Math.round((subtotal+taxAmount)*100)/100;
    const invoiceSeq=order.id.replace(/\D/g,'').padStart(5,'0');
    const invoice: SalesInvoice={id:`INV-S-${invoiceSeq}`,number:`F002-${invoiceSeq}`,documentType:'sales',status:'issued',issuedAt:'2026-09-01',dueDate:'2026-10-01',currency:order.currency,customerName:order.customerName,salesOrderId:order.id,lines:order.lines.map(l=>({description:`${l.productCode} — ${l.description}`,quantity:l.quantity,unitPrice:l.unitPrice,subtotal:l.quantity*l.unitPrice})),subtotal,taxAmount,total,paidAmount:0,outstandingBalance:total};
    this.invoicingState.addInvoice(invoice);
    saveOrder({...order,status:'invoiced',relatedDocuments:[...(order.relatedDocuments??[]),{id:`DOC-${order.id}-F`,type:'factura',label:'Factura',number:invoice.number,date:invoice.issuedAt}]});
    toast.success(`Factura ${invoice.number} emitida`); this.router.navigate(['/apps/finance/invoices',invoice.id]);
  }
}
