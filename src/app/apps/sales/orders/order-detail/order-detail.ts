import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { SalesOrderStatus, SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, SalesInvoice, Tone } from '@core/models';
import { acceptSalesOrderWorkSheet, markProductionReady, salesOrders, saveOrder, verifyProduction } from '../../sales-state';
import { InvoicingState } from '../../../finance/invoicing-state';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, EntityHeader, EmptyState],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly invoicingState = inject(InvoicingState);
  readonly id = input.required<string>();
  protected readonly order = computed(() => salesOrders().find(o => o.id === this.id()));
  protected readonly actionPopover = signal<string | null>(null);
  protected statusLabel = (s: SalesOrderStatus) => SALES_ORDER_STATUS_LABEL[s];
  protected statusTone = (s: SalesOrderStatus): Tone => SALES_ORDER_STATUS_TONE[s];

  protected canAccept = computed(() => this.order()?.status === 'confirmed' && !!this.order()?.workSheetId);
  protected canVerify = computed(() => this.order()?.status === 'production_ready');
  protected canInvoice = computed(() => ['dispatched','finished'].includes(this.order()?.status ?? ''));

  protected acceptProduction(): void { const o=this.order(); if(!o)return; acceptSalesOrderWorkSheet(o.id); this.actionPopover.set(null); toast.success(`${o.number}: HT aceptada por Producción`); }
  protected notifyReady(): void { const o=this.order(); if(!o)return; markProductionReady(o.id); this.actionPopover.set(null); toast.success(`${o.number}: Producción indicó que está lista para verificación`); }
  protected verify(): void { const o=this.order(); if(!o)return; verifyProduction(o.id); this.actionPopover.set(null); toast.success(`${o.number}: verificación completada`,{description:'El pedido quedó listo para despacho'}); }

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
