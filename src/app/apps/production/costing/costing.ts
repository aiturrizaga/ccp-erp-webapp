import { Component, computed, inject, signal } from '@angular/core';
import { HlmButtonImports } from '@ui/button';
import { CostingState } from './costing-state';
import { CostPart, CostProduct, CostResourceType } from './costing.models';

type Tab='products'|'resources'|'parts'|'templates'|'simulator';
@Component({selector:'app-costing',imports:[...HlmButtonImports],templateUrl:'./costing.html'})
export class Costing {
  protected readonly state=inject(CostingState);
  protected readonly tab=signal<Tab>('products');
  protected readonly tabs:{id:Tab;label:string}[]=[{id:'products',label:'Productos costeados'},{id:'templates',label:'Plantillas'},{id:'parts',label:'Partidas / APU'},{id:'resources',label:'Recursos y precios'},{id:'simulator',label:'Simulador'}];
  protected readonly selectedProductId=signal<string|null>(null);
  protected readonly selectedProduct=computed(()=>this.selectedProductId()?this.state.product(this.selectedProductId()!):undefined);
  protected readonly simResource=signal('r3'); protected readonly simPct=signal(8);
  protected readonly filteredSummaries=computed(()=>this.state.summaries());
  protected readonly productsWithIncrease=computed(()=>this.state.summaries().filter(x=>x.variationPct>0).length);
  protected readonly simulation=computed(()=>this.state.affectedProducts(this.simResource()).map(product=>{const current=this.state.productCost(product); const r=this.state.resource(this.simResource()); if(!r)return {product,current,simulated:current,impact:0}; const delta=this.state.productCostWithOverride(product,r.id,r.currentCost*(1+this.simPct()/100))-current; const simulated=current+delta; return {product,current,simulated,impact:current?delta/current*100:0};}));
  protected money(v:number){return v.toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});}
  protected templateName(id:string){return this.state.template(id)?.name??id;} protected resourceName(id:string){return this.state.resource(id)?.name??id;} protected resourceUnit(id:string){return this.state.resource(id)?.unit??'';} protected resourceCost(id:string){return this.state.resource(id)?.currentCost??0;}
  protected typeLabel(t:CostResourceType){return ({material:'Material',labor:'Mano de obra',service:'Servicio',equipment:'Equipo'})[t];}
  protected partLabel(id:string){const p=this.state.parts().find(x=>x.id===id);return p?`${p.code} · ${p.name}`:id;}
  protected changeCost(id:string,e:Event){this.state.updateResourceCost(id,Number((e.target as HTMLInputElement).value));}
  protected openProduct(id:string){this.selectedProductId.set(id);} protected productSummary(p:CostProduct){return this.state.summary(p);}
  protected productParts(p:CostProduct){const t=this.state.template(p.templateId);return this.state.parts().filter(x=>t?.partIds.includes(x.id));}
  protected partCost(product:CostProduct,partId:string){const p=this.state.parts().find(x=>x.id===partId);return p?.lines.reduce((s,l)=>s+this.state.lineCost(product,l.resourceId,l.quantity,l.wastePct),0)??0;}
  protected parameterEntries(p:CostProduct){return Object.entries(p.parameters);} protected parameterLabel(k:string){return ({longitud:'Longitud (m)',diametroPunta:'Diámetro punta (mm)',conicidad:'Conicidad (mm/m)',recubrimiento:'Recubrimiento (mm)',pasoEspiral:'Paso espiral (m)' } as Record<string,string>)[k]??k;}
  protected asValue(e:Event){return (e.target as HTMLSelectElement).value;} protected asNumber(e:Event){return Number((e.target as HTMLInputElement).value)||0;}
}
