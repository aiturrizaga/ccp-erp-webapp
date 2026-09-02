import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { salesCustomers, salesOrders } from '@apps/sales/sales-state';
import { InvoicingState } from '../../invoicing-state';
import { GUIDE_GLOSA_LABEL, GuideGlosa, GuideKind } from '@core/models';

@Component({
  selector: 'app-guide-create',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, EntityHeader],
  templateUrl: './guide-create.html',
})
export class GuideCreate {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);

  protected readonly orderId = signal('');
  protected readonly kind = signal<GuideKind>('sunat');
  protected readonly glosa = signal<GuideGlosa>('traslado');
  protected readonly motivoTraslado = signal('Venta');
  protected readonly transportista = signal('FLOTA PROPIA CCP');
  protected readonly destinationAddress = signal('');
  protected readonly generatesInvoice = signal(true);

  protected readonly orders = computed(() => salesOrders().filter((o) => o.status !== 'cancelled'));
  protected readonly selectedOrder = computed(() => this.orders().find((o) => o.id === this.orderId()));
  protected readonly glosaOptions = (Object.keys(GUIDE_GLOSA_LABEL) as GuideGlosa[]).map((value) => ({ value, label: GUIDE_GLOSA_LABEL[value] }));

  protected readonly canSubmit = computed(() => !!this.selectedOrder());

  protected orderToString = (v: string) => this.orders().find((o) => o.id === v)?.number ?? v;
  protected glosaToString = (v: string) => GUIDE_GLOSA_LABEL[v as GuideGlosa] ?? v;
  protected kindToString = (v: string) => (v === 'sunat' ? 'SUNAT (electrónica)' : 'Uso interno');

  protected submit(): void {
    const order = this.selectedOrder();
    if (!order) return;
    const customer = salesCustomers().find((c) => c.id === order.customerId);
    const guide = this.state.createGuide({
      kind: this.kind(),
      salesOrderId: order.id,
      salesOrderNumber: order.number,
      customerName: order.customerName,
      customerTaxId: customer?.taxId ?? '',
      glosa: this.glosa(),
      motivoTraslado: this.motivoTraslado().trim(),
      transportista: this.transportista().trim(),
      originAddress: 'URB. LAS DALMACIAS LOTE 17, PUENTE PIEDRA - LIMA',
      destinationAddress: this.destinationAddress().trim() || order.deliveryAddress,
      issuedAt: '2026-09-01',
      status: 'issued',
      lines: order.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitOfMeasure: l.unitOfMeasure })),
    });

    if (this.generatesInvoice() && this.glosa() !== 'guia_custodia') {
      const igv = order.total - order.total / 1.18;
      const invoice = this.state.createFreeInvoice({
        status: 'issued',
        customerName: order.customerName,
        customerId: order.customerId,
        customerTaxId: customer?.taxId,
        salesOrderId: order.id,
        issuedAt: '2026-09-01',
        dueDate: '2026-09-01',
        currency: order.currency,
        lines: order.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, subtotal: l.quantity * l.unitPrice })),
        subtotal: order.total - igv,
        taxAmount: igv,
        total: order.total,
        paidAmount: 0,
        outstandingBalance: order.total,
        docKind: 'factura',
        paymentCondition: customer?.paymentMode === 'cash' ? 'contado' : 'credito',
        glosa: order.glosa,
        dispatchGuideId: guide.id,
        quotationCode: order.quotationId,
      });
      this.state.updateGuide(guide.id, { generatedInvoiceId: invoice.id });
      toast.success(`Guía ${guide.number} y factura ${invoice.number} generadas`);
    } else {
      toast.success(`Guía ${guide.number} generada`);
    }
    this.router.navigate(['/apps/invoicing/guides']);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/invoicing/guides']);
  }
}
