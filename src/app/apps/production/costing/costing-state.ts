import { Injectable, computed, signal } from '@angular/core';
import { COST_PARTS, COST_PRODUCTS, COST_RESOURCES, COST_TEMPLATES } from './costing.data';
import { CostPart, CostProduct, CostResource, CostTemplate, ProductCostSummary } from './costing.models';

@Injectable({providedIn:'root'})
export class CostingState {
  readonly resources=signal<CostResource[]>(structuredClone(COST_RESOURCES));
  readonly parts=signal<CostPart[]>(structuredClone(COST_PARTS));
  readonly templates=signal<CostTemplate[]>(structuredClone(COST_TEMPLATES));
  readonly products=signal<CostProduct[]>(structuredClone(COST_PRODUCTS));
  readonly lastChange=signal<{resource:string;affected:number}|null>(null);
  resource(id:string){return this.resources().find(r=>r.id===id);} template(id:string){return this.templates().find(t=>t.id===id);} product(id:string){return this.products().find(p=>p.id===id);}
  factor(product:CostProduct,resourceId:string){return product.quantityFactors?.[resourceId]??1;}
  lineCost(product:CostProduct,resourceId:string,quantity:number,wastePct=0,previous=false){const r=this.resource(resourceId);return r?quantity*this.factor(product,resourceId)*(1+wastePct/100)*(previous?r.previousCost:r.currentCost):0;}
  productCost(product:CostProduct,previous=false){const t=this.template(product.templateId);if(!t)return 0;return this.parts().filter(p=>t.partIds.includes(p.id)).flatMap(p=>p.lines).reduce((s,l)=>s+this.lineCost(product,l.resourceId,l.quantity,l.wastePct,previous),0);}
  productCostWithOverride(product:CostProduct,resourceId:string,overrideCost:number){const t=this.template(product.templateId);if(!t)return 0;return this.parts().filter(p=>t.partIds.includes(p.id)).flatMap(p=>p.lines).reduce((s,l)=>{const r=this.resource(l.resourceId);if(!r)return s;return s+l.quantity*this.factor(product,l.resourceId)*(1+(l.wastePct??0)/100)*(l.resourceId===resourceId?overrideCost:r.currentCost);},0);}
  summary(product:CostProduct):ProductCostSummary{const directCost=this.productCost(product),previousCost=this.productCost(product,true);return{product,directCost,previousCost,minPrice:directCost*(1+product.minMarkupPct/100),targetPrice:directCost*(1+product.targetMarkupPct/100),maxPrice:directCost*(1+product.maxMarkupPct/100),variationPct:previousCost?(directCost/previousCost-1)*100:0};}
  readonly summaries=computed(()=>this.products().map(p=>this.summary(p)));
  affectedProducts(resourceId:string){return this.products().filter(product=>{const t=this.template(product.templateId);return !!t&&this.parts().some(p=>t.partIds.includes(p.id)&&p.lines.some(l=>l.resourceId===resourceId));});}
  updateResourceCost(id:string,newCost:number){if(!Number.isFinite(newCost)||newCost<=0)return;const affected=this.affectedProducts(id).length;let name='';this.resources.update(a=>a.map(r=>{if(r.id!==id)return r;name=r.name;return{...r,previousCost:r.currentCost,currentCost:newCost,effectiveFrom:new Date().toISOString().slice(0,10)}}));this.lastChange.set({resource:name,affected});}
  saveResource(x:CostResource){this.resources.update(a=>a.some(v=>v.id===x.id)?a.map(v=>v.id===x.id?structuredClone(x):v):[...a,structuredClone(x)]);}
  deleteResource(id:string){if(this.parts().some(p=>p.lines.some(l=>l.resourceId===id)))return false;this.resources.update(a=>a.filter(x=>x.id!==id));return true;}
  savePart(x:CostPart){this.parts.update(a=>a.some(v=>v.id===x.id)?a.map(v=>v.id===x.id?structuredClone(x):v):[...a,structuredClone(x)]);}
  deletePart(id:string){if(this.templates().some(t=>t.partIds.includes(id)))return false;this.parts.update(a=>a.filter(x=>x.id!==id));return true;}
  saveTemplate(x:CostTemplate){this.templates.update(a=>a.some(v=>v.id===x.id)?a.map(v=>v.id===x.id?structuredClone(x):v):[...a,structuredClone(x)]);}
  deleteTemplate(id:string){if(this.products().some(p=>p.templateId===id))return false;this.templates.update(a=>a.filter(x=>x.id!==id));return true;}
  saveProduct(x:CostProduct){this.products.update(a=>a.some(v=>v.id===x.id)?a.map(v=>v.id===x.id?structuredClone(x):v):[...a,structuredClone(x)]);}
  deleteProduct(id:string){this.products.update(a=>a.filter(x=>x.id!==id));}
  nextId(prefix:string){return prefix+Date.now().toString(36);}
}
