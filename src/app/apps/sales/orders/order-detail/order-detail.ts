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
import { CustomerOrderDocumentType, CUSTOMER_ORDER_DOCUMENT_TYPE_LABEL, SalesOrderStatus, SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, SalesInvoice, Tone } from '@core/models';
import { acceptSalesOrderWorkSheet, markProductionReady, salesOrders, salesQuotations, saveOrder, verifyProduction } from '../../sales-state';
import { InvoicingState } from '../../../finance/invoicing-state';

@Component({
  selector: 'app-order-detail',
  imports: [FormsModule, RouterLink, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, EntityHeader, EmptyState],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly invoicingState = inject(InvoicingState);
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

  constructor() {
    effect(() => {
      const order = this.order();
      if (!order || this.documentFormInitialized()) return;
      this.documentType.set(order.customerOrderDocumentType ?? 'purchase_order');
      this.documentNumber.set(order.customerOrderDocumentNumber ?? '');
      this.documentFile.set(order.customerOrderDocument ? { name: order.customerOrderDocument.name, uploadedAt: order.customerOrderDocument.uploadedAt } : null);
      this.documentFormInitialized.set(true);
    });
  }

  protected canAccept = computed(() => this.order()?.status === 'confirmed' && !!this.order()?.workSheetId);
  protected canVerify = computed(() => this.order()?.status === 'production_ready');
  protected canInvoice = computed(() => ['dispatched','finished'].includes(this.order()?.status ?? ''));

  protected acceptProduction(): void { const o=this.order(); if(!o)return; acceptSalesOrderWorkSheet(o.id); this.actionPopover.set(null); toast.success(`${o.number}: HT aceptada por Producción`); }
  protected notifyReady(): void { const o=this.order(); if(!o)return; markProductionReady(o.id); this.actionPopover.set(null); toast.success(`${o.number}: Producción indicó que está lista para verificación`); }
  protected verify(): void { const o=this.order(); if(!o)return; verifyProduction(o.id); this.actionPopover.set(null); toast.success(`${o.number}: verificación completada`,{description:'El pedido quedó listo para despacho'}); }

  protected statusToString = (value: string): string => this.statusOptions.find((option) => option.value === value)?.label ?? value;
  protected documentTypeToString = (value: string): string => this.documentTypeOptions.find((option) => option.value === value)?.label ?? value;
  protected changeStatus(status: string | null | undefined): void {
    if (!status || !this.statusOptions.some((option) => option.value === status)) return;
    const order = this.order();
    if (!order || order.status === status) return;
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
