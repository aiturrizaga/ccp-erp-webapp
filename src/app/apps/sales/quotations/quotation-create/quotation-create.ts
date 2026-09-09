import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { ProductPicker } from '@shared/components/product-picker/product-picker';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { createQuotation, salesContacts, salesCustomers, salesProducts } from '../../sales-state';
import { Customer, SalesProduct, formatSalesProductName } from '@core/models';

interface DraftLine { salesProductId: string; productCode: string; description: string; quantity: number; unitOfMeasure: string; unitCost?: number; unitPrice: number; }
interface DraftDelivery { id: string; address: string; cost: number; }

@Component({
  selector: 'app-quotation-create',
  imports: [FormsModule, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ProductPicker, EntityHeader],
  templateUrl: './quotation-create.html',
})
export class QuotationCreate {
  private readonly router = inject(Router);
  protected readonly customers = salesCustomers;
  protected readonly products = salesProducts;
  protected readonly contacts = salesContacts;
  protected readonly customerId = signal('');
  protected readonly customerSearch = signal('');
  protected readonly customerOpen = signal(false);
  protected readonly contactId = signal('');
  protected readonly expiresAt = signal('2026-09-30');
  protected readonly notes = signal('');
  protected readonly lines = signal<DraftLine[]>([]);
  protected readonly deliveries = signal<DraftDelivery[]>([]);

  protected readonly customer = computed(() => this.customers().find(c => c.id === this.customerId()));
  protected readonly customerOptions = computed(() => { const q=this.customerSearch().trim().toLowerCase(); return this.customers().filter(c => !q || `${c.legalName} ${c.taxId}`.toLowerCase().includes(q)).slice(0,10); });
  protected readonly customerContacts = computed(() => this.contacts().filter(c => c.customerId === this.customerId()));
  protected readonly currency = computed(() => this.customer()?.currency ?? 'PEN');
  protected readonly productsTotal = computed(() => this.lines().reduce((s,l)=>s+l.quantity*l.unitPrice,0));
  protected readonly shippingTotal = computed(() => this.deliveries().reduce((s,d)=>s+d.cost,0));
  protected readonly total = computed(() => this.productsTotal()+this.shippingTotal());
  protected readonly canSubmit = computed(() => !!this.customerId() && !!this.contactId() && this.lines().length>0 && this.lines().every(l=>l.quantity>0&&l.unitPrice>=0) && this.deliveries().every(d=>!!d.address.trim()&&d.cost>=0));

  protected chooseCustomer(c: Customer): void { this.customerId.set(c.id); this.customerSearch.set(c.legalName); this.customerOpen.set(false); const first=this.customerContacts()[0]; this.contactId.set(first?.id ?? ''); }
  protected onCustomerSearch(v:string): void { this.customerSearch.set(v); this.customerOpen.set(true); if (this.customerId() && !v.startsWith(this.customer()?.legalName ?? '')) { this.customerId.set(''); this.contactId.set(''); } }
  protected onCustomerFocus(): void { this.customerOpen.set(true); }
  protected onProductPicked(p:SalesProduct):void { this.lines.update(rows=>{ const i=rows.findIndex(r=>r.salesProductId===p.id); if(i>=0)return rows.map((r,j)=>j===i?{...r,quantity:r.quantity+1}:r); return [...rows,{salesProductId:p.id,productCode:p.legacyCode,description:formatSalesProductName(p),quantity:1,unitOfMeasure:p.unitOfMeasure,unitCost:p.productionUnitCost,unitPrice:p.costBand.max}]; }); }
  protected setLine(i:number,patch:Partial<DraftLine>):void { this.lines.update(rows=>rows.map((r,j)=>j===i?{...r,...patch}:r)); }
  protected removeLine(i:number):void { this.lines.update(rows=>rows.filter((_,j)=>j!==i)); }
  protected addDelivery():void { this.deliveries.update(rows=>[...rows,{id:`DEL-${Date.now()}`,address:this.customer()?.address ?? '',cost:0}]); }
  protected setDelivery(i:number,patch:Partial<DraftDelivery>):void { this.deliveries.update(rows=>rows.map((r,j)=>j===i?{...r,...patch}:r)); }
  protected removeDelivery(i:number):void { this.deliveries.update(rows=>rows.filter((_,j)=>j!==i)); }
  protected submit():void { const c=this.customer(); if(!c||!this.canSubmit())return; const q=createQuotation({customerId:c.id,customerName:c.legalName,contactId:this.contactId(),currency:c.currency,expiresAt:this.expiresAt(),lines:this.lines(),deliveries:this.deliveries(),notes:this.notes().trim()||undefined}); toast.success(`Cotización ${q.number} creada`); this.router.navigate(['/apps/sales/quotations',q.id]); }
  protected cancel():void { this.router.navigate(['/apps/sales/quotations']); }
}
