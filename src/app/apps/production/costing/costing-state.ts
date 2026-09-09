import { Injectable, computed, signal } from '@angular/core';
import { COST_PARTS, COST_PRODUCTS, COST_RESOURCES, COST_TEMPLATES } from './costing.data';
import { CostProduct, CostResource, ProductCostSummary } from './costing.models';

@Injectable({providedIn:'root'})
export class CostingState {
  readonly resources = signal<CostResource[]>(structuredClone(COST_RESOURCES));
  readonly parts = signal(structuredClone(COST_PARTS));
  readonly templates = signal(structuredClone(COST_TEMPLATES));
  readonly products = signal(structuredClone(COST_PRODUCTS));
  readonly lastChange = signal<{resource:string; affected:number}|null>(null);

  resource(id:string){ return this.resources().find(r=>r.id===id); }
  template(id:string){ return this.templates().find(t=>t.id===id); }
  product(id:string){ return this.products().find(p=>p.id===id); }
  factor(product:CostProduct, resourceId:string){ return product.quantityFactors?.[resourceId] ?? 1; }

  lineCost(product:CostProduct, resourceId:string, quantity:number, wastePct=0, previous=false):number {
    const r=this.resource(resourceId); if(!r) return 0;
    return quantity*this.factor(product,resourceId)*(1+wastePct/100)*(previous?r.previousCost:r.currentCost);
  }
  productCostWithOverride(product:CostProduct, resourceId:string, overrideCost:number):number {
    const tpl=this.template(product.templateId); if(!tpl) return 0;
    return this.parts().filter(p=>tpl.partIds.includes(p.id)).flatMap(p=>p.lines).reduce((sum,l)=>{
      const r=this.resource(l.resourceId); if(!r) return sum;
      const unitCost=l.resourceId===resourceId?overrideCost:r.currentCost;
      return sum+l.quantity*this.factor(product,l.resourceId)*(1+(l.wastePct??0)/100)*unitCost;
    },0);
  }
  productCost(product:CostProduct, previous=false):number {
    const tpl=this.template(product.templateId); if(!tpl) return 0;
    return this.parts().filter(p=>tpl.partIds.includes(p.id)).flatMap(p=>p.lines)
      .reduce((s,l)=>s+this.lineCost(product,l.resourceId,l.quantity,l.wastePct,previous),0);
  }
  summary(product:CostProduct):ProductCostSummary {
    const directCost=this.productCost(product), previousCost=this.productCost(product,true);
    return {product,directCost,previousCost,minPrice:directCost*(1+product.minMarkupPct/100),targetPrice:directCost*(1+product.targetMarkupPct/100),maxPrice:directCost*(1+product.maxMarkupPct/100),variationPct:previousCost?((directCost/previousCost)-1)*100:0};
  }
  readonly summaries=computed(()=>this.products().map(p=>this.summary(p)));
  readonly totalCurrentValue=computed(()=>this.summaries().reduce((s,x)=>s+x.directCost,0));

  affectedProducts(resourceId:string):CostProduct[]{
    return this.products().filter(product=>{
      const tpl=this.template(product.templateId); if(!tpl) return false;
      return this.parts().some(p=>tpl.partIds.includes(p.id)&&p.lines.some(l=>l.resourceId===resourceId));
    });
  }
  updateResourceCost(resourceId:string,newCost:number):void{
    if(!Number.isFinite(newCost)||newCost<=0)return;
    const affected=this.affectedProducts(resourceId).length;
    let name='';
    this.resources.update(rows=>rows.map(r=>{if(r.id!==resourceId)return r; name=r.name; return {...r,previousCost:r.currentCost,currentCost:newCost,effectiveFrom:'2026-09-08'};}));
    this.lastChange.set({resource:name,affected});
  }
}
