import { Component, computed, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmPopoverImports } from '@ui/popover';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { salesClaims, salesOrders, recordDispatch } from '../sales-state';
import { SalesOrder, SalesOrderLine } from '@core/models';

@Component({
  selector: 'app-dispatch-board',
  imports: [FormsModule, RouterLink, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmPopoverImports, EntityHeader, StatusBadge],
  templateUrl: './dispatch-board.html',
})
export class DispatchBoard {
  protected readonly quantities = signal<Record<string, number>>({});
  protected readonly readyForDispatch = computed(() => salesOrders().filter(o => ['ready_for_dispatch','partially_dispatched'].includes(o.status) && o.readyForDispatch));
  private hasOpenClaim(o: SalesOrder): boolean { return salesClaims().some(c => c.salesOrderId===o.id && c.status!=='resolved' && c.status!=='rejected'); }
  protected canDeliver(o: SalesOrder): boolean { return !this.hasOpenClaim(o) && (!o.paymentGate || o.paymentGate.status==='validated' || o.paymentGate.status==='not_required'); }
  protected pending(line: SalesOrder['lines'][number]): number { return line.quantity-(line.dispatchedQuantity??0); }
  protected setQty(orderId:string,index:number,value:number):void { this.quantities.update(q=>({...q,[`${orderId}:${index}`]:Math.max(0,+value||0)})); }
  protected qty(orderId:string,index:number,max:number):number { return Math.min(this.quantities()[`${orderId}:${index}`] ?? max,max); }
  protected dispatch(o:SalesOrder):void {
    if(!this.canDeliver(o)) return;
    const qs=o.lines.map((l,i)=>this.qty(o.id,i,this.pending(l)));
    if(!qs.some(q=>q>0)) return;
    recordDispatch(o.id,qs); toast.success(`${o.number} actualizado`,{description:qs.some((q,i)=>q< this.pending(o.lines[i]))?'Se registró un despacho parcial':'Se registró el despacho'});
    this.quantities.update(q=>{const n={...q}; o.lines.forEach((_,i)=>delete n[`${o.id}:${i}`]); return n;});
  }
}
