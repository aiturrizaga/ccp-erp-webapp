import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmComboboxImports } from '@ui/combobox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { AuthState } from '@shell/auth-state';
import { createClaim, salesCustomers, salesOrders } from '../../sales-state';
import { CLAIM_DEFECT_TYPE_LABEL, ClaimDefectType } from '@core/models';

@Component({ selector:'app-claim-create', imports:[FormsModule,NgIcon,...HlmButtonImports,...HlmCardImports,...HlmInputImports,...HlmLabelImports,...HlmSelectImports,...HlmComboboxImports,EntityHeader], templateUrl:'./claim-create.html' })
export class ClaimCreate {
  private readonly router=inject(Router); private readonly auth=inject(AuthState);
  protected readonly customerId=signal(''); protected readonly orderId=signal(''); protected readonly defectType=signal<ClaimDefectType>('fisura'); protected readonly description=signal(''); protected readonly evidenceNames=signal<string[]>([]); protected readonly evidenceInput=signal('');
  protected readonly customers=salesCustomers; protected readonly orders=computed(()=>salesOrders().filter(o=>o.customerId===this.customerId()&&o.status!=='cancelled'));
  protected readonly defectOptions=(Object.keys(CLAIM_DEFECT_TYPE_LABEL) as ClaimDefectType[]).map(value=>({value,label:CLAIM_DEFECT_TYPE_LABEL[value]}));
  protected readonly canSubmit=computed(()=>!!this.customerId()&&!!this.orderId()&&!!this.description().trim());
  protected customerToString=(v:string)=>this.customers().find(c=>c.id===v)?.legalName??v;
  protected orderToString=(v:string)=>this.orders().find(o=>o.id===v)?.number??v;
  protected defectToString=(v:string)=>CLAIM_DEFECT_TYPE_LABEL[v as ClaimDefectType]??v;
  protected onCustomerChange(id:string):void { this.customerId.set(id); this.orderId.set(''); }
  protected addEvidence():void { const n=this.evidenceInput().trim(); if(!n)return; this.evidenceNames.update(x=>[...x,n]); this.evidenceInput.set(''); }
  protected removeEvidence(i:number):void { this.evidenceNames.update(x=>x.filter((_,n)=>n!==i)); }
  protected submit():void { const order=this.orders().find(o=>o.id===this.orderId()); if(!order||!this.canSubmit())return; const claim=createClaim({order,defectType:this.defectType(),description:this.description().trim(),evidence:this.evidenceNames().map(name=>({name,kind:/\.(jpg|jpeg|png|webp)$/i.test(name)?'image':/\.pdf$/i.test(name)?'pdf':'document',uploadedAt:'2026-09-01'})),createdBy:this.auth.currentUser()?.name??'Ventas'}); toast.success(`Reclamo ${claim.number} registrado`); this.router.navigate(['/apps/sales/claims',claim.id]); }
  protected cancel():void { this.router.navigate(['/apps/sales/claims']); }
}
