import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmPopoverImports } from '@ui/popover';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { CustomerOrderDocumentType, CUSTOMER_ORDER_DOCUMENT_TYPE_LABEL, SALES_ORDER_WORK_SHEET_TYPE_LABEL, SalesOrderWorkSheetType, SalesOrderStatus, SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, PAYMENT_GATE_STATUS_LABEL, PAYMENT_GATE_STATUS_TONE, PAYMENT_METHOD_LABEL, PaymentMethod, SalesInvoice, Tone } from '@core/models';
import { acceptSalesOrderWorkSheet, markProductionReady, registerAdvancePayment, salesOrders, salesQuotations, saveOrder, verifyProduction } from '../../sales-state';
import { ProductionState } from '../../../production/production-state';
import { InvoicingState } from '../../../finance/invoicing-state';

@Component({
  selector: 'app-order-detail',
  imports: [FormsModule, RouterLink, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, EntityHeader, EmptyState, StatusBadge],
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
  protected statusLabel = (s: SalesOrderStatus) => SALES_ORDER_STATUS_LABEL[s];
  protected statusTone = (s: SalesOrderStatus): Tone => SALES_ORDER_STATUS_TONE[s];
  protected readonly statusOptions = (Object.keys(SALES_ORDER_STATUS_LABEL) as SalesOrderStatus[]).map((value) => ({ value, label: SALES_ORDER_STATUS_LABEL[value] }));
  protected readonly documentTypeOptions = (Object.keys(CUSTOMER_ORDER_DOCUMENT_TYPE_LABEL) as CustomerOrderDocumentType[]).map((value) => ({ value, label: CUSTOMER_ORDER_DOCUMENT_TYPE_LABEL[value] }));
  protected readonly documentType = signal<CustomerOrderDocumentType>('purchase_order');
  protected readonly documentNumber = signal('');
  protected readonly documentFile = signal<{ name: string; uploadedAt: string } | null>(null);
  protected readonly documentFormInitialized = signal(false);
  protected readonly internalNotes = signal('');
  protected readonly workSheetType = signal<SalesOrderWorkSheetType>('regular');
  protected readonly workSheetTypeOptions = (Object.keys(SALES_ORDER_WORK_SHEET_TYPE_LABEL) as SalesOrderWorkSheetType[]).map((value) => ({ value, label: SALES_ORDER_WORK_SHEET_TYPE_LABEL[value] }));
  protected readonly workSheetPopover = signal<'open' | 'closed'>('closed');
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
      if (!order || this.documentFormInitialized()) return;
      this.documentType.set(order.customerOrderDocumentType ?? 'purchase_order');
      this.documentNumber.set(order.customerOrderDocumentNumber ?? '');
      this.documentFile.set(order.customerOrderDocument ? { name: order.customerOrderDocument.name, uploadedAt: order.customerOrderDocument.uploadedAt } : null);
      this.documentFormInitialized.set(true);
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
    this.workSheetPopover.set('closed');
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
  protected documentTypeToString = (value: string): string => this.documentTypeOptions.find((option) => option.value === value)?.label ?? value;
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

  protected onDocumentFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Solo se permiten archivos PDF'); return; }
    this.documentFile.set({ name: file.name, uploadedAt: new Date().toISOString() });
  }

  protected saveCustomerDocument(): void {
    const order = this.order();
    if (!order) return;
    if (!this.documentNumber().trim()) { toast.error('Ingresa el número o código del documento del cliente'); return; }
    const type = this.documentType();
    const file = this.documentFile();
    saveOrder({
      ...order,
      customerOrderDocumentType: type,
      customerOrderDocumentNumber: this.documentNumber().trim() || undefined,
      customerOrderDocument: file ? { type: type === 'quotation' ? 'customer_quotation' : 'customer_purchase_order', ...file } : undefined,
    });
    toast.success('Documentación del cliente actualizada');
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
