import { Approval } from '@core/models';

/** Transversal approval inbox — spans documents from Purchasing (requisitions, POs) and supplier onboarding. */
export const APPROVALS: Approval[] = [
  {
    id: 'APR-001', process: 'purchase_requirement', documentId: 'RC-005', documentNumber: 'RC-2026-0005',
    description: 'Electrodos de soldadura para mantenimiento de moldes', amount: 1252, currency: 'PEN', plant: 'AL01 · Planta 01',
    requestedBy: 'Haldeer Vasquez', createdAt: '2026-07-20', status: 'approved',
    levels: [
      { order: 1, role: 'Jefe de Producción', approver: 'Jorge Salcedo', status: 'approved', date: '2026-07-20', comment: 'Conforme, urgente para mantenimiento correctivo.', slaHours: 8 },
    ],
  },
  {
    id: 'APR-002', process: 'purchase_order', documentId: 'PO-001', documentNumber: 'OC-2026-0512',
    description: 'Cemento CEMEX Portland Tipo I — 600 bolsas', amount: 13200, currency: 'PEN', plant: 'AL01 · Planta 01',
    requestedBy: 'Jorge Salcedo', createdAt: '2026-08-06', status: 'approved',
    levels: [
      { order: 1, role: 'Jefe de Compras', approver: 'Jorge Salcedo', status: 'approved', date: '2026-08-06', comment: 'Dentro de presupuesto de producción de agosto.', slaHours: 8 },
      { order: 2, role: 'Gerencia', approver: 'Gerencia General', status: 'approved', date: '2026-08-06', comment: 'Aprobado, proveedor con crédito disponible.', slaHours: 24 },
    ],
  },
  {
    id: 'APR-003', process: 'purchase_order', documentId: 'PO-005', documentNumber: 'OC-2026-0490',
    description: 'Importación de moldes para poste 9m (repuesto de rueda)', amount: 380, currency: 'USD', plant: 'AL01 · Planta 01',
    requestedBy: 'Jorge Salcedo', createdAt: '2026-06-30', status: 'approved',
    levels: [
      { order: 1, role: 'Jefe de Compras', approver: 'Jorge Salcedo', status: 'approved', date: '2026-06-30', comment: '', slaHours: 8 },
      { order: 2, role: 'Gerencia', approver: 'Gerencia General', status: 'approved', date: '2026-07-01', comment: 'Compra crítica para mantenimiento de moldes, aprobada pese al lead time.', slaHours: 24 },
      { order: 3, role: 'Gerencia General', approver: 'Gerencia General', status: 'approved', date: '2026-07-01', comment: 'Monto en USD mayor a S/ 20,000 equivalente — requiere doble validación.', slaHours: 24 },
    ],
  },
  {
    id: 'APR-004', process: 'purchase_requirement', documentId: 'RC-006', documentNumber: 'RC-2026-0006',
    description: 'Repuesto de brida para molde de poste', amount: 1320, currency: 'PEN', plant: 'AL01 · Planta 01',
    requestedBy: 'Jorge Salcedo', createdAt: '2026-07-22', status: 'rejected',
    levels: [
      { order: 1, role: 'Jefe de Almacén', approver: 'Rosa Injante', status: 'rejected', date: '2026-07-23', comment: 'Existe stock de repuesto equivalente en Almacén Principal — usar ese primero.', slaHours: 8 },
    ],
  },
  {
    id: 'APR-005', process: 'purchase_requirement', documentId: 'RC-002', documentNumber: 'RC-2026-0002',
    description: 'Sellador y alquitrán para acabado de ductos', amount: 3105, currency: 'PEN', plant: 'AL01 · Planta 01',
    requestedBy: 'Cristian Espinoza', createdAt: '2026-08-10', status: 'pending',
    levels: [
      { order: 1, role: 'Jefe de Almacén', approver: 'Rosa Injante', status: 'pending', slaHours: 8 },
      { order: 2, role: 'Gerencia', status: 'pending', slaHours: 24 },
    ],
  },
  {
    id: 'APR-006', process: 'purchase_order', documentId: 'PO-009', documentNumber: 'OC-2026-0515',
    description: 'Fierro corrugado 1/2" — 2000 unidades', amount: 34000, currency: 'PEN', plant: 'AL01 · Planta 01',
    requestedBy: 'Jorge Salcedo', createdAt: '2026-08-16', status: 'rejected',
    levels: [
      { order: 1, role: 'Jefe de Compras', approver: 'Jorge Salcedo', status: 'approved', date: '2026-08-16', comment: '', slaHours: 8 },
      { order: 2, role: 'Gerencia General', approver: 'Gerencia General', status: 'rejected', date: '2026-08-17', comment: 'Excede el crédito disponible de Acerodex S.A.C. (S/ 96,500 de S/ 180,000 ya utilizados). Redistribuir entre 2 proveedores.', slaHours: 24 },
    ],
  },
  {
    id: 'APR-007', process: 'supplier', documentId: 'SUP-020', documentNumber: 'PROV-020',
    description: 'Alta de proveedor: AUTO PARTS PLUS I & A S.A.C.', plant: 'AL01 · Planta 01',
    requestedBy: 'Rosa Injante', createdAt: '2026-08-14', status: 'pending',
    levels: [{ order: 1, role: 'Gerencia General', status: 'pending', slaHours: 48 }],
  },
  {
    id: 'APR-008', process: 'supplier', documentId: 'SUP-019', documentNumber: 'PROV-019',
    description: 'Alta de proveedor: AHORA QUISCA INVERSIONES SAC-AQUISI S.A.C.', plant: 'AL01 · Planta 01',
    requestedBy: 'Jorge Salcedo', createdAt: '2026-06-02', status: 'rejected',
    levels: [{ order: 1, role: 'Gerencia General', approver: 'Gerencia General', status: 'rejected', date: '2026-06-05', comment: 'Documentación tributaria incompleta; sin referencias comerciales verificables.', slaHours: 48 }],
  },
  {
    id: 'APR-009', process: 'purchase_order', documentId: 'PO-004', documentNumber: 'OC-2026-0514',
    description: 'Tubería PVC 5/8" — 200 unidades', amount: 740, currency: 'PEN', plant: 'AL01 · Planta 01',
    requestedBy: 'Rosa Injante', createdAt: '2026-08-15', status: 'pending',
    levels: [{ order: 1, role: 'Jefe de Compras', status: 'pending', slaHours: 8 }],
  },
  {
    id: 'APR-010', process: 'bom_change', documentId: 'BOM-004', documentNumber: 'BOM-004 v1.4',
    description: 'Cambio de receta: Caja cuadrada 40x40x30 — reducción de cemento por optimización de mezcla', plant: 'AL01 · Planta 01',
    requestedBy: 'Equipo PLM', createdAt: '2026-08-01', status: 'pending',
    levels: [
      { order: 1, role: 'Supervisor de Producción', status: 'pending', slaHours: 24 },
      { order: 2, role: 'Gerencia', status: 'pending', slaHours: 24 },
    ],
  },
];
