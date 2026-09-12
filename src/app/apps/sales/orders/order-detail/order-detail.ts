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
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL, SalesOrderCustomerDocumentType, SALES_ORDER_WORK_SHEET_TYPE_LABEL, SalesOrderWorkSheetType, SalesOrderStatus, SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, PAYMENT_GATE_STATUS_LABEL, PAYMENT_GATE_STATUS_TONE, PAYMENT_METHOD_LABEL, PaymentMethod, SalesInvoice, SalesRelatedDocument, Tone } from '@core/models';
import { acceptSalesOrderWorkSheet, markProductionReady, registerAdvancePayment, salesContacts, salesOrders, salesQuotations, saveOrder, verifyProduction } from '../../sales-state';
import { ProductionState } from '../../../production/production-state';
import { InvoicingState } from '../../../finance/invoicing-state';

@Component({
  selector: 'app-order-detail',
  imports: [FormsModule, RouterLink, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmDialogImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, EmptyState, StatusBadge],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly invoicingState = inject(InvoicingState);
  private readonly productionState = inject(ProductionState);
  readonly id = input.required<string>();
  protected readonly order = computed(() => salesOrders().find(o => o.id === this.id()));
  protected readonly quotation = computed(() => salesQuotations().find((q) => q.id === this.order()?.quotationId));
  protected readonly contactName = computed(() => {
    const o = this.order();
    if (!o?.contactId) return '—';
    return salesContacts().find((contact) => contact.id === o.contactId)?.name ?? '—';
  });
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
  protected readonly customerDocumentModal = signal<'open' | 'closed'>('closed');
  protected readonly customerDocumentType = signal<SalesOrderCustomerDocumentType>('purchase_order');
  protected readonly customerDocumentCode = signal('');
  protected readonly customerDocumentObservation = signal('');
  protected readonly customerDocumentFile = signal<{ name: string; uploadedAt: string; mimeType?: string; url?: string } | null>(null);
  protected readonly customerDocumentTypeOptions = (Object.keys(SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL) as SalesOrderCustomerDocumentType[]).map((value) => ({ value, label: SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL[value] }));
  protected readonly internalNotes = signal('');
  protected readonly workSheetType = signal<SalesOrderWorkSheetType>('regular');
  protected readonly SALES_ORDER_WORK_SHEET_TYPE_LABEL = SALES_ORDER_WORK_SHEET_TYPE_LABEL;
  protected readonly workSheetTypeOptions = (Object.keys(SALES_ORDER_WORK_SHEET_TYPE_LABEL) as SalesOrderWorkSheetType[]).map((value) => ({ value, label: SALES_ORDER_WORK_SHEET_TYPE_LABEL[value] }));
  protected readonly workSheetModal = signal<'open' | 'closed'>('closed');
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

  protected readonly existingWorkSheets = computed(() => {
    const o = this.order();
    if (!o || !this.paymentCleared()) return [];
    const ids = o.workSheetIds?.length ? o.workSheetIds : (o.workSheetId ? [o.workSheetId] : []);
    return ids.map((id) => this.productionState.workSheets().find((ws) => ws.id === id)).filter(Boolean);
  });

  protected readonly canManageFlow = computed(() => this.paymentCleared() && this.order()?.status !== 'cancelled');
  protected readonly canCreateWorkSheet = computed(() => {
    const o = this.order();
    return !!o && this.canManageFlow() && !['cancelled', 'pending_payment'].includes(o.status) && o.lines.length > 0;
  });
  protected readonly advanceCount = computed(() => this.order()?.paymentGate?.advancePayment ? 1 : 0);
  protected readonly documentCount = computed(() => (this.order()?.relatedDocuments?.length ?? 0) + (this.order()?.customerDocuments?.length ?? 0));
  protected readonly notesCount = computed(() => this.order()?.internalNotes?.trim() ? 1 : 0);
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

  protected readonly orderTimeline = computed(() => {
    const o = this.order();
    if (!o) return [];
    const quotation = this.quotation();
    const current = this.currentFlowStep();
    const advance = o.paymentGate?.advancePayment;
    const hasCredit = !o.paymentGate;
    const invoice = this.invoicingState.invoices().find((item) => item.documentType === 'sales' && 'salesOrderId' in item && item.salesOrderId === o.id);
    const events: Array<{ title: string; detail: string; date?: string; state: 'completed' | 'current' | 'pending' }> = [];
    const add = (title: string, detail: string, date: string | undefined, step: number) => events.push({ title, detail, date, state: step < current ? 'completed' : step === current ? 'current' : 'pending' });

    if (quotation) {
      events.push({ title: 'Cotización creada', detail: `${quotation.number} · ${quotation.customerName}`, date: quotation.issuedAt, state: 'completed' });
      events.push({ title: 'Cotización aceptada', detail: 'La cotización dio origen a esta orden de pedido.', date: o.confirmedAt, state: 'completed' });
    }
    add('Orden de pedido creada', `${o.number} · ${o.customerName}`, o.confirmedAt, 1);

    if (o.paymentGate && !hasCredit) {
      if (advance) {
        events.push({ title: 'Adelanto registrado', detail: `${advance.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ${o.currency} · ${this.methodLabel(advance.method)}`, date: advance.registeredAt || advance.date, state: 'completed' });
        events.push({ title: advance.validatedAt ? 'Adelanto validado por Cobranzas' : 'Adelanto enviado a Cobranzas', detail: advance.validatedBy ? `Validado por ${advance.validatedBy}` : 'Pendiente de validación del comprobante.', date: advance.validatedAt, state: advance.validatedAt ? 'completed' : 'current' });
      } else {
        events.push({ title: 'Adelanto pendiente', detail: 'La orden está bloqueada hasta registrar y validar el adelanto.', state: 'current' });
      }
    }

    const worksheets = this.existingWorkSheets();
    if (worksheets.length) {
      events.push({ title: worksheets.length === 1 ? 'HT creada' : 'HT creadas', detail: worksheets.map((ws) => ws?.number).filter(Boolean).join(' · '), date: o.relatedDocuments?.find((doc) => doc.type === 'hoja_trabajo')?.date, state: current >= 2 ? 'completed' : 'current' });
    } else {
      events.push({ title: 'HT por crear', detail: 'Ventas deberá crear la hoja de trabajo cuando la orden esté habilitada.', state: current > 1 ? 'completed' : 'pending' });
    }

    add('HT aceptada por Producción', 'Producción tomó la orden para ejecución.', undefined, 2);
    add('Producción terminada', 'Producción completó las cantidades solicitadas.', undefined, 3);
    add('Ventas verificó la producción', 'Ventas confirmó que el pedido está listo para despacho.', o.readyForDispatchAt, 4);
    add('Pedido despachado', 'El pedido salió de almacén y quedó registrado el despacho.', o.dispatchedAt, 6);
    events.push({ title: 'Facturación', detail: invoice ? `${invoice.number} · comprobante emitido` : 'Pendiente de emisión del comprobante.', date: invoice?.issuedAt, state: invoice ? 'completed' : current >= 7 ? 'current' : 'pending' });
    return events;
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
  protected canVerify = computed(() => this.order()?.status === 'production_ready');
  protected canInvoice = computed(() => ['dispatched','finished'].includes(this.order()?.status ?? ''));

  protected acceptProduction(): void { const o=this.order(); if(!o)return; acceptSalesOrderWorkSheet(o.id); this.actionPopover.set(null); toast.success(`${o.number}: HT aceptada por Producción`); }
  protected notifyReady(): void { const o=this.order(); if(!o)return; markProductionReady(o.id); this.actionPopover.set(null); toast.success(`${o.number}: Producción indicó que está lista para verificación`); }
  protected verify(): void { const o=this.order(); if(!o)return; verifyProduction(o.id); this.actionPopover.set(null); toast.success(`${o.number}: verificación completada`,{description:'El pedido quedó listo para despacho'}); }

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

  protected openCustomerDocumentDialog(): void {
    this.customerDocumentType.set('purchase_order');
    this.customerDocumentCode.set('');
    this.customerDocumentObservation.set('');
    this.customerDocumentFile.set(null);
    this.customerDocumentModal.set('open');
  }

  protected customerDocumentTypeToString = (value: string): string => SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL[value as SalesOrderCustomerDocumentType] ?? value;
  protected setCustomerDocumentType(value: string | null | undefined): void {
    if (!value) return;
    if (value in SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL) this.customerDocumentType.set(value as SalesOrderCustomerDocumentType);
  }

  protected onCustomerDocumentFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Solo se permiten imágenes o archivos PDF');
      return;
    }
    this.customerDocumentFile.set({
      name: file.name,
      uploadedAt: new Date().toISOString(),
      mimeType: file.type,
      url: URL.createObjectURL(file),
    });
  }

  protected clearCustomerDocumentFile(): void {
    const file = this.customerDocumentFile();
    if (file?.url) URL.revokeObjectURL(file.url);
    this.customerDocumentFile.set(null);
  }

  protected saveCustomerDocument(): void {
    const order = this.order();
    if (!order) return;
    const file = this.customerDocumentFile();
    const next: import('@core/models').SalesOrderCustomerDocument = {
      id: `CUST-DOC-${order.id}-${Date.now()}`,
      type: this.customerDocumentType(),
      code: this.customerDocumentCode().trim() || undefined,
      observation: this.customerDocumentObservation().trim() || undefined,
      file: file ? { ...file } : undefined,
      createdAt: new Date().toISOString(),
    };
    saveOrder({ ...order, customerDocuments: [...(order.customerDocuments ?? []), next] });
    this.customerDocumentModal.set('closed');
    toast.success('Documento del cliente agregado');
  }

  protected customerDocuments = computed(() => {
    const order = this.order();
    if (!order) return [];
    const docs = [...(order.customerDocuments ?? [])];
    if (order.customerOrderDocument && !docs.some((doc) => doc.type === 'purchase_order' && doc.code === order.customerOrderDocumentNumber)) {
      docs.unshift({
        id: `LEGACY-CUST-DOC-${order.id}`,
        type: 'purchase_order' as const,
        code: order.customerOrderDocumentNumber || undefined,
        file: {
          name: order.customerOrderDocument.name,
          uploadedAt: order.customerOrderDocument.uploadedAt,
          url: order.customerOrderDocument.url,
        },
        createdAt: order.customerOrderDocument.uploadedAt,
      });
    }
    return docs;
  });

  protected customerDocumentLabel(type: SalesOrderCustomerDocumentType): string {
    return SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL[type];
  }

  protected relatedDocumentRoute(doc: SalesRelatedDocument): string[] | null {
    switch (doc.type) {
      case 'cotizacion': {
        const quotationId = salesQuotations().find((q) => q.number === doc.number)?.id ?? this.order()?.quotationId;
        return quotationId ? ['/apps/sales/quotations', quotationId] : null;
      }
      case 'hoja_trabajo': {
        const ws = this.existingWorkSheets().find((item) => item?.number === doc.number);
        return ws ? ['/apps/production/work-sheets', ws.id] : null;
      }
      case 'factura': {
        const invoice = this.invoicingState.invoices().find((item) => item.number === doc.number);
        return invoice ? ['/apps/finance/invoices', invoice.id] : null;
      }
      case 'guia':
        return ['/apps/finance/guides'];
      default:
        return null;
    }
  }

  protected relatedDocumentDownloadName(doc: SalesRelatedDocument): string {
    return doc.fileName ?? `${doc.number ?? doc.label}.pdf`;
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
