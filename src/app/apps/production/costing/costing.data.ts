import { CostPart, CostProduct, CostResource, CostTemplate } from './costing.models';

export const COST_RESOURCES: CostResource[] = [
  { id:'r1', code:'MAT-001', name:'Acero JIS G3532 / ASTM A496 4.7 mm', type:'material', unit:'kg', currentCost:4.85, previousCost:4.62, effectiveFrom:'2026-09-01' },
  { id:'r2', code:'MAT-002', name:'Acero corrugado Fy=4200 Grado 60 3/8"', type:'material', unit:'kg', currentCost:4.35, previousCost:4.20, effectiveFrom:'2026-09-01' },
  { id:'r3', code:'MAT-003', name:'Cemento Portland Tipo I', type:'material', unit:'bolsa', currentCost:30.10, previousCost:28.50, effectiveFrom:'2026-09-01' },
  { id:'r4', code:'MAT-004', name:'Piedra Huso 67', type:'material', unit:'m³', currentCost:82.00, previousCost:78.00, effectiveFrom:'2026-08-15' },
  { id:'r5', code:'MAT-005', name:'Polvillo', type:'material', unit:'m³', currentCost:48.00, previousCost:46.00, effectiveFrom:'2026-08-15' },
  { id:'r6', code:'MAT-006', name:'Alambre trefilado N° 14 (2 mm)', type:'material', unit:'kg', currentCost:6.90, previousCost:6.60, effectiveFrom:'2026-09-01' },
  { id:'r7', code:'MAT-007', name:'Alambre recocido N° 16', type:'material', unit:'kg', currentCost:6.20, previousCost:6.00, effectiveFrom:'2026-09-01' },
  { id:'r8', code:'INS-001', name:'Desmoldante para metal', type:'material', unit:'gal', currentCost:49.00, previousCost:47.50, effectiveFrom:'2026-08-20' },
  { id:'r9', code:'INS-002', name:'Impermeabilizante Chema Bitumen', type:'material', unit:'gal', currentCost:72.00, previousCost:69.00, effectiveFrom:'2026-08-20' },
  { id:'r10', code:'INS-003', name:'Soldadura', type:'material', unit:'kg', currentCost:18.50, previousCost:18.00, effectiveFrom:'2026-09-01' },
  { id:'r11', code:'SER-001', name:'Gas natural', type:'service', unit:'m³', currentCost:2.45, previousCost:2.35, effectiveFrom:'2026-09-01' },
  { id:'r12', code:'SER-002', name:'Energía eléctrica', type:'service', unit:'kWh', currentCost:0.78, previousCost:0.74, effectiveFrom:'2026-09-01' },
  { id:'r13', code:'SER-003', name:'Agua industrial', type:'service', unit:'m³', currentCost:6.40, previousCost:6.10, effectiveFrom:'2026-09-01' },
  { id:'r14', code:'MO-001', name:'Operario de producción', type:'labor', unit:'hh', currentCost:14.50, previousCost:13.50, effectiveFrom:'2026-09-01' },
  { id:'r15', code:'MO-002', name:'Soldador especializado', type:'labor', unit:'hh', currentCost:18.00, previousCost:17.00, effectiveFrom:'2026-09-01' },
  { id:'r16', code:'EQ-001', name:'Centrífuga / equipo de fabricación', type:'equipment', unit:'hm', currentCost:32.00, previousCost:30.00, effectiveFrom:'2026-09-01' },
];

export const COST_PARTS: CostPart[] = [
 { id:'p1', code:'01', name:'Armadura de acero', lines:[{resourceId:'r1',quantity:18.4,wastePct:3},{resourceId:'r2',quantity:10.8,wastePct:3},{resourceId:'r6',quantity:3.25,wastePct:2},{resourceId:'r7',quantity:0.8,wastePct:2},{resourceId:'r15',quantity:0.55}] },
 { id:'p2', code:'02', name:'Concreto', lines:[{resourceId:'r3',quantity:1.82,wastePct:2},{resourceId:'r4',quantity:0.095,wastePct:3},{resourceId:'r5',quantity:0.072,wastePct:3},{resourceId:'r13',quantity:0.055}] },
 { id:'p3', code:'03', name:'Moldeo y centrifugado', lines:[{resourceId:'r8',quantity:0.09},{resourceId:'r10',quantity:0.12},{resourceId:'r11',quantity:1.8},{resourceId:'r12',quantity:7.5},{resourceId:'r16',quantity:0.45},{resourceId:'r14',quantity:1.15}] },
 { id:'p4', code:'04', name:'Acabado e impermeabilización', lines:[{resourceId:'r9',quantity:0.12},{resourceId:'r14',quantity:0.45}] },
];
export const COST_TEMPLATES: CostTemplate[] = [
 { id:'t1', code:'TPL-POSTE-CAC', name:'Postes C.A.C.', family:'Postes de concreto armado centrifugado', partIds:['p1','p2','p3','p4'] },
 { id:'t2', code:'TPL-POSTE-CAC-RF', name:'Postes C.A.C. reforzados', family:'Postes de concreto armado centrifugado', partIds:['p1','p2','p3','p4'] },
];
export const COST_PRODUCTS: CostProduct[] = [
 { id:'cp1', code:'7-200-2-120', name:'Poste C.A.C. 7-200-2-120', templateId:'t1', version:'V03', unit:'UND', parameters:{longitud:7,diametroPunta:120,conicidad:15,recubrimiento:15,pasoEspiral:0.08}, quantityFactors:{r1:1,r2:1,r3:1,r4:1,r5:1,r6:1,r7:1}, minMarkupPct:15,targetMarkupPct:25,maxMarkupPct:40 },
 { id:'cp2', code:'8-200-2-120', name:'Poste C.A.C. 8-200-2-120', templateId:'t1', version:'V02', unit:'UND', parameters:{longitud:8,diametroPunta:120,conicidad:15,recubrimiento:15,pasoEspiral:0.08}, quantityFactors:{r1:1.14,r2:1.12,r3:1.13,r4:1.13,r5:1.13,r6:1.14,r7:1.14}, minMarkupPct:15,targetMarkupPct:25,maxMarkupPct:40 },
 { id:'cp3', code:'9-300-2-135', name:'Poste C.A.C. 9-300-2-135', templateId:'t2', version:'V01', unit:'UND', parameters:{longitud:9,diametroPunta:135,conicidad:15,recubrimiento:15,pasoEspiral:0.075}, quantityFactors:{r1:1.38,r2:1.45,r3:1.34,r4:1.34,r5:1.34,r6:1.35,r7:1.35}, minMarkupPct:18,targetMarkupPct:28,maxMarkupPct:42 },
 { id:'cp4', code:'11-400-2-160', name:'Poste C.A.C. 11-400-2-160', templateId:'t2', version:'V01', unit:'UND', parameters:{longitud:11,diametroPunta:160,conicidad:15,recubrimiento:18,pasoEspiral:0.07}, quantityFactors:{r1:1.78,r2:1.9,r3:1.72,r4:1.72,r5:1.72,r6:1.75,r7:1.75}, minMarkupPct:18,targetMarkupPct:30,maxMarkupPct:45 },
];
