import { CreditAgreement, DispatchGuide, DocSeries, DocumentDelivery } from '@core/models';

const CCP_RUC = '20549546626';
const CCP_NAME = 'CONCRETO CENTRIFUGADO PERU S.A.C.';

export const DOC_SERIES: DocSeries[] = [
  { id: 'DS-001', emisorRuc: CCP_RUC, emisorName: CCP_NAME, docKind: 'factura', series: 'F001', lastCorrelativo: 7255, environment: 'sunat', active: true },
  { id: 'DS-002', emisorRuc: CCP_RUC, emisorName: CCP_NAME, docKind: 'boleta', series: 'B001', lastCorrelativo: 1840, environment: 'sunat', active: true },
  { id: 'DS-003', emisorRuc: CCP_RUC, emisorName: CCP_NAME, docKind: 'nota_credito', series: 'FC01', lastCorrelativo: 312, environment: 'sunat', active: true },
  { id: 'DS-004', emisorRuc: CCP_RUC, emisorName: CCP_NAME, docKind: 'nota_debito', series: 'FD01', lastCorrelativo: 45, environment: 'sunat', active: true },
  { id: 'DS-005', emisorRuc: CCP_RUC, emisorName: CCP_NAME, docKind: 'guia_remision', series: 'T001', lastCorrelativo: 6287, environment: 'sunat', active: true },
  { id: 'DS-006', emisorRuc: CCP_RUC, emisorName: CCP_NAME, docKind: 'guia_remision', series: 'G900', lastCorrelativo: 2190, environment: 'interna', active: true },
];

export const DISPATCH_GUIDES: DispatchGuide[] = [
  {
    id: 'DG-001', kind: 'sunat', series: 'T001', correlativo: '00006287', number: 'T001-00006287',
    salesOrderId: 'SO-001', salesOrderNumber: 'PV-2026-0501',
    customerName: 'CONSTRUCTORA ANDINA S.A.C.', customerTaxId: '20486185296',
    glosa: 'traslado', motivoTraslado: 'Venta', transportista: 'TRANSPORTES CARGA PESADA S.A.C. — RUC 20601122334',
    originAddress: 'URB. LAS DALMACIAS LOTE 17, PUENTE PIEDRA - LIMA', destinationAddress: 'Km 45 Carretera Panamericana Sur, Cañete, Lima',
    issuedAt: '2026-07-28', status: 'delivered',
    lines: [
      { description: 'POSTES DE C.A.C DE 9/300/2/150/285 C/PERILLA', quantity: 60, unitOfMeasure: 'UND' },
      { description: 'CRUCETA SIMETRICA Z/1.20/250-275MMD', quantity: 60, unitOfMeasure: 'UND' },
    ],
    generatedInvoiceId: 'INV-S-001',
  },
  {
    id: 'DG-002', kind: 'sunat', series: 'T001', correlativo: '00006301', number: 'T001-00006301',
    salesOrderId: 'SO-002', salesOrderNumber: 'PV-2026-0502',
    customerName: 'CONSORCIO VIAL RUTAS DEL SUR S.A.', customerTaxId: '20548672190',
    glosa: 'entrega_parcial', motivoTraslado: 'Venta con entrega parcial', transportista: 'FLOTA PROPIA CCP',
    originAddress: 'URB. LAS DALMACIAS LOTE 17, PUENTE PIEDRA - LIMA', destinationAddress: 'Av. Industrial 890, Chincha Alta, Ica',
    issuedAt: '2026-08-24', status: 'in_transit',
    lines: [{ description: 'POSTES DE C.A.C DE 9/300/2/150/285 C/PERILLA', quantity: 25, unitOfMeasure: 'UND' }],
  },
  {
    id: 'DG-003', kind: 'interna', series: 'G900', correlativo: '00002190', number: 'G900-00002190',
    salesOrderId: 'SO-003', salesOrderNumber: 'PV-2026-0503',
    customerName: 'CONSORCIO VIAL CHINCHA S.A.', customerTaxId: '20548001234',
    glosa: 'guia_custodia', motivoTraslado: 'Traslado a patio de custodia — pendiente de retiro por el cliente', transportista: 'FLOTA PROPIA CCP',
    originAddress: 'PLANTA 2 — PUENTE PIEDRA', destinationAddress: 'PATIO DE CUSTODIA CCP — PLANTA 1',
    issuedAt: '2026-08-27', status: 'issued',
    lines: [{ description: 'POSTES DE C.A.C DE 9/300/2/150/285 C/PERILLA', quantity: 45, unitOfMeasure: 'UND' }],
  },
];

export const CREDIT_AGREEMENTS: CreditAgreement[] = [
  {
    id: 'CA-001', number: 'CONV-2026-001', customerId: 'CUS-001', customerName: 'ELECTRO SUR ESTE S.A.A.',
    limit: 250000, currency: 'PEN', termDays: 30, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active',
    approvals: [
      { area: 'Ventas', approvedBy: 'Jefe de Ventas', approvedAt: '2025-12-18', status: 'approved' },
      { area: 'Gerencia', approvedBy: 'Gerencia General', approvedAt: '2025-12-20', status: 'approved' },
      { area: 'Contabilidad', approvedBy: 'Contador General', approvedAt: '2025-12-22', status: 'approved' },
    ],
    notes: 'Contrato marco anual. Revisión de límite en julio según comportamiento de pago.',
  },
  {
    id: 'CA-002', number: 'CONV-2026-002', customerId: 'CUS-003', customerName: 'MUNICIPALIDAD DISTRITAL DE SAN JUAN DE LURIGANCHO',
    limit: 400000, currency: 'PEN', termDays: 60, validFrom: '2026-03-01', validTo: '2026-12-31', status: 'active',
    approvals: [
      { area: 'Ventas', approvedBy: 'Jefe de Ventas', approvedAt: '2026-02-20', status: 'approved' },
      { area: 'Gerencia', approvedBy: 'Gerencia General', approvedAt: '2026-02-24', status: 'approved' },
      { area: 'Contabilidad', approvedBy: 'Contador General', approvedAt: '2026-02-26', status: 'approved' },
    ],
    notes: 'Entidad pública. Crédito excedido actualmente — evaluar ampliación o retención de despachos.',
  },
  {
    id: 'CA-003', number: 'CONV-2026-003', customerId: 'CUS-009', customerName: 'INSTALACIONES ELECTRICAS DEL PACIFICO S.A.C.',
    limit: 120000, currency: 'PEN', termDays: 30, validFrom: '2026-09-01', validTo: '2027-08-31', status: 'pending_approval',
    approvals: [
      { area: 'Ventas', approvedBy: 'Jefe de Ventas', approvedAt: '2026-08-28', status: 'approved' },
      { area: 'Gerencia', status: 'pending' },
      { area: 'Contabilidad', status: 'pending' },
    ],
    notes: 'Solicitud de ampliación de S/ 80k a S/ 120k por nuevo proyecto en Trujillo.',
  },
];

export const DOCUMENT_DELIVERIES: DocumentDelivery[] = [
  {
    id: 'DLV-001', customerId: 'CUS-001', customerName: 'ELECTRO SUR ESTE S.A.A.',
    documents: ['F001-00007074', 'T001-00006287'], channel: 'email', to: 'facturacion@electrosureste.com.pe',
    sentAt: '2026-08-13', kind: 'single', status: 'sent',
  },
];
