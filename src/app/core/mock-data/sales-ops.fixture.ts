import { SalesClaim, SalesDecisionRule } from '@core/models';

export const SALES_DECISION_RULES: SalesDecisionRule[] = [
  {
    id: 'SDR-001',
    label: 'Regla comercial vigente 2026',
    minMarginPct: 18,
    autoApproveBelowAmount: 60000,
    blockBelowViableMin: true,
    active: true,
  },
];

export const SALES_CLAIMS: SalesClaim[] = [
  {
    id: 'SCL-001',
    number: 'REC-2026-0001',
    salesOrderId: 'SO-002',
    salesOrderNumber: 'PV-2026-0502',
    customerId: 'CUS-006',
    customerName: 'CONSORCIO VIAL RUTAS DEL SUR S.A.',
    defectType: 'fisura',
    description: 'Cliente reporta 3 postes CAC 9m con fisuras longitudinales visibles cerca de la base tras la descarga en obra.',
    evidence: [
      { name: 'fisura-poste-01.jpg', kind: 'image', uploadedAt: '2026-08-26' },
      { name: 'fisura-poste-02.jpg', kind: 'image', uploadedAt: '2026-08-26' },
      { name: 'informe-recepcion-obra.pdf', kind: 'pdf', uploadedAt: '2026-08-26' },
    ],
    status: 'in_review',
    resolution: 'pendiente',
    createdBy: 'Ana (Ventas)',
    createdAt: '2026-08-26',
    history: [
      { at: '2026-08-26', action: 'Reclamo registrado', by: 'Ana (Ventas)' },
      { at: '2026-08-27', action: 'Derivado a Producción para evaluación', by: 'Ana (Ventas)' },
    ],
  },
  {
    id: 'SCL-002',
    number: 'REC-2026-0002',
    salesOrderId: 'SO-006',
    salesOrderNumber: 'PV-2026-0506',
    customerId: 'CUS-004',
    customerName: 'DISTRIBUIDORA ELECTRICA DEL NORTE S.A.C.',
    defectType: 'rotura',
    description: '1 poste CAC 13m llegó con la cabeza rota, presumiblemente por mal estibado en el transporte.',
    evidence: [{ name: 'poste-roto.jpg', kind: 'image', uploadedAt: '2026-08-20' }],
    status: 'resolved',
    resolution: 'reposicion',
    resolutionDetail: 'Producción aprobó la reposición de 1 unidad. Se generó HT de reposición y se coordinó nuevo despacho sin costo.',
    replacementWorkSheetId: 'HT-2026-0148',
    createdBy: 'Ana (Ventas)',
    createdAt: '2026-08-20',
    history: [
      { at: '2026-08-20', action: 'Reclamo registrado', by: 'Ana (Ventas)' },
      { at: '2026-08-21', action: 'Producción evaluó evidencias', by: 'J. Ramírez (Producción)' },
      { at: '2026-08-22', action: 'Gerencia aprobó reposición', by: 'Gerencia' },
      { at: '2026-08-23', action: 'HT de reposición generada', detail: 'HT-2026-0148' },
    ],
  },
];
