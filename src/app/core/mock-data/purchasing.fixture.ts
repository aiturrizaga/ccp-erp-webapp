import { PurchaseOrder, PurchaseRequisition, Quotation } from '@core/models';

export const PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: 'PR-001', number: 'SC-2026-0142', origin: 'production', requestedBy: 'Haldeer Vasquez', area: 'Producción', plant: 'Planta Lima',
    priority: 'high', status: 'purchasing', createdAt: '2026-08-04', neededBy: '2026-08-18',
    lines: [
      { itemId: 'MP00006', quantity: 600, unitOfMeasure: 'BOL', neededBy: '2026-08-18', availableStock: 180 },
      { itemId: 'MP00011', quantity: 3000, unitOfMeasure: 'UND', neededBy: '2026-08-18', availableStock: 900 },
    ],
    workSheetRef: 'HT-2026-0311', approvalId: 'APR-002',
  },
  {
    id: 'PR-002', number: 'SC-2026-0143', origin: 'inventory', requestedBy: 'Cristian Espinoza', area: 'Almacén', plant: 'Planta Lima',
    priority: 'medium', status: 'pending_approval', createdAt: '2026-08-10', neededBy: '2026-08-25',
    lines: [
      { itemId: 'MA00002', quantity: 30, unitOfMeasure: 'GAL', neededBy: '2026-08-25', availableStock: 6 },
      { itemId: 'MA00003', quantity: 15, unitOfMeasure: 'GAL', neededBy: '2026-08-25', availableStock: 3 },
    ],
    approvalId: 'APR-005',
  },
  {
    id: 'PR-003', number: 'SC-2026-0144', origin: 'forecast', requestedBy: 'Sistema — Proyección de inventario', area: 'Almacén', plant: 'Planta Lima',
    priority: 'medium', status: 'approved', createdAt: '2026-08-11', neededBy: '2026-09-01',
    lines: [
      { itemId: 'MP00001', quantity: 60, unitOfMeasure: 'M3', neededBy: '2026-09-01', availableStock: 22 },
      { itemId: 'MP00002', quantity: 80, unitOfMeasure: 'M3', neededBy: '2026-09-01', availableStock: 31 },
      { itemId: 'MP00003', quantity: 50, unitOfMeasure: 'M3', neededBy: '2026-09-01', availableStock: 18 },
    ],
  },
  {
    id: 'PR-004', number: 'SC-2026-0145', origin: 'production', requestedBy: 'Alex Vasquez', area: 'Producción', plant: 'Planta Lima',
    priority: 'critical', status: 'sourcing', createdAt: '2026-08-12', neededBy: '2026-08-20',
    lines: [
      { itemId: 'MP00013', quantity: 1200, unitOfMeasure: 'UND', neededBy: '2026-08-20', availableStock: 240 },
      { itemId: 'MP00014', quantity: 300, unitOfMeasure: 'UND', neededBy: '2026-08-20', availableStock: 40 },
    ],
  },
  {
    id: 'PR-005', number: 'SC-2026-0146', origin: 'inventory', requestedBy: 'Rosa Injante', area: 'Almacén', plant: 'Planta Lima',
    priority: 'low', status: 'draft', createdAt: '2026-08-15', neededBy: '2026-09-05',
    lines: [
      { itemId: 'SU00096', quantity: 12, unitOfMeasure: 'PAR', neededBy: '2026-09-05', availableStock: 3 },
      { itemId: 'SU00284', quantity: 20, unitOfMeasure: 'UND', neededBy: '2026-09-05', availableStock: 5 },
    ],
  },
  {
    id: 'PR-006', number: 'SC-2026-0138', origin: 'production', requestedBy: 'Haldeer Vasquez', area: 'Producción', plant: 'Planta Lima',
    priority: 'high', status: 'fulfilled', createdAt: '2026-07-20', neededBy: '2026-08-01',
    lines: [
      { itemId: 'MA00001', quantity: 60, unitOfMeasure: 'KG', neededBy: '2026-08-01', availableStock: 60 },
      { itemId: 'MA00024', quantity: 40, unitOfMeasure: 'KG', neededBy: '2026-08-01', availableStock: 40 },
    ],
    approvalId: 'APR-001',
  },
  {
    id: 'PR-007', number: 'SC-2026-0139', origin: 'other', requestedBy: 'Jorge Salcedo', area: 'Mantenimiento planta', plant: 'Planta Lima',
    priority: 'medium', status: 'rejected', createdAt: '2026-07-22', neededBy: '2026-08-05',
    lines: [{ itemId: 'SU01064', quantity: 6, unitOfMeasure: 'UND', neededBy: '2026-08-05', availableStock: 2, note: 'Rechazado: usar stock de repuestos existente primero.' }],
    approvalId: 'APR-004',
  },
  {
    id: 'PR-008', number: 'SC-2026-0147', origin: 'production', requestedBy: 'Cristian Espinoza', area: 'Producción', plant: 'Planta Lima',
    priority: 'medium', status: 'awarded', createdAt: '2026-08-13', neededBy: '2026-08-28',
    lines: [{ itemId: 'MA00031', quantity: 200, unitOfMeasure: 'UND', neededBy: '2026-08-28', availableStock: 45 }],
  },
  {
    id: 'PR-009', number: 'SC-2026-0148', origin: 'production', requestedBy: 'Sistema — Generación automática desde HT', area: 'Producción', plant: 'Planta Lima — P3',
    priority: 'high', status: 'draft', createdAt: '2026-08-22', neededBy: '2026-08-29',
    lines: [
      { itemId: 'MP00008', quantity: 160, unitOfMeasure: 'BOL', neededBy: '2026-08-29', availableStock: 900, notNeeded: true },
      { itemId: 'MP00003', quantity: 8.1, unitOfMeasure: 'M3', neededBy: '2026-08-29', availableStock: 18, notNeeded: true },
      { itemId: 'MA00031', quantity: 135, suggestedQuantity: 135, unitOfMeasure: 'UND', neededBy: '2026-08-29', availableStock: 45 },
    ],
    workSheetRef: 'HT-2026-0330',
  },
  {
    id: 'PR-010', number: 'SC-2026-0149', origin: 'production', requestedBy: 'Sistema — Generación automática desde HT', area: 'Producción', plant: 'Planta Accesorios',
    priority: 'medium', status: 'draft', createdAt: '2026-08-22', neededBy: '2026-08-30',
    lines: [
      { itemId: 'MP00009', quantity: 38, suggestedQuantity: 38, unitOfMeasure: 'BOL', neededBy: '2026-08-30', availableStock: 60 },
      { itemId: 'SU01122', quantity: 35, unitOfMeasure: 'UND', neededBy: '2026-08-30', availableStock: 72, notNeeded: true },
      { itemId: 'SU00096', quantity: 6, unitOfMeasure: 'PAR', neededBy: '2026-08-30', availableStock: 3, addedManually: true },
    ],
    workSheetRef: 'HT-2026-0332',
    note: 'Se agregaron guantes de seguridad para el equipo de moldeo — no venían incluidos en la Hoja de Trabajo.',
  },
  {
    id: 'PR-011', number: 'SC-2026-0150', origin: 'production', requestedBy: 'Sistema — Generación automática desde HT', area: 'Producción', plant: 'Planta Accesorios',
    priority: 'low', status: 'draft', createdAt: '2026-08-23', neededBy: '2026-08-31',
    lines: [
      { itemId: 'MP00009', quantity: 15, suggestedQuantity: 15, unitOfMeasure: 'BOL', neededBy: '2026-08-31', availableStock: 60 },
      { itemId: 'MP00004', quantity: 2.7, unitOfMeasure: 'M3', neededBy: '2026-08-31', availableStock: 18, notNeeded: true },
    ],
    workSheetRef: 'HT-2026-0335',
  },
  {
    id: 'PR-012', number: 'SC-2026-0151', origin: 'production', requestedBy: 'Sistema — Generación automática desde HT', area: 'Producción', plant: 'Planta Lima — P2',
    priority: 'medium', status: 'draft', createdAt: '2026-08-23', neededBy: '2026-09-02',
    lines: [
      { itemId: 'MP00006', quantity: 50, suggestedQuantity: 50, unitOfMeasure: 'BOL', neededBy: '2026-09-02', availableStock: 150 },
      { itemId: 'MP00013', quantity: 150, unitOfMeasure: 'UND', neededBy: '2026-09-02', availableStock: 1740, notNeeded: true },
    ],
    workSheetRef: 'HT-2026-0340',
  },
  {
    id: 'PR-013', number: 'SC-2026-0152', origin: 'production', requestedBy: 'Sistema — Generación automática desde HT', area: 'Producción', plant: 'Planta Accesorios',
    priority: 'high', status: 'draft', createdAt: '2026-08-24', neededBy: '2026-09-03',
    lines: [
      { itemId: 'MP00004', quantity: 2, suggestedQuantity: 2, unitOfMeasure: 'M3', neededBy: '2026-09-03', availableStock: 4 },
      { itemId: 'SU01122', quantity: 20, unitOfMeasure: 'UND', neededBy: '2026-09-03', availableStock: 72, notNeeded: true },
    ],
    workSheetRef: 'HT-2026-0342',
  },
];

export const QUOTATIONS: Quotation[] = [
  {
    id: 'QT-001', number: 'COT-2026-0088', requisitionId: 'PR-001', status: 'awarded', createdAt: '2026-08-05', dueDate: '2026-08-09',
    lines: [
      { itemId: 'MP00006', quantity: 600, unitOfMeasure: 'BOL', offers: [
        { supplierId: 'SUP-011', unitPrice: 22, currency: 'PEN', deliveryDays: 3, paymentTerms: 'CREDITO A 15 DIAS', attachmentName: 'cotizacion-cemex-0088.pdf', selected: true },
        { supplierId: 'SUP-012', unitPrice: 21.6, currency: 'PEN', deliveryDays: 5, paymentTerms: 'CREDITO A 15 DIAS', attachmentName: 'cotizacion-pacasmayo-0088.pdf', selected: false },
      ] },
      { itemId: 'MP00011', quantity: 3000, unitOfMeasure: 'UND', offers: [
        { supplierId: 'SUP-013', unitPrice: 16.3, currency: 'PEN', deliveryDays: 5, paymentTerms: 'CREDITO A 30 DIAS', attachmentName: 'cotizacion-arequipa-0088.pdf', selected: true },
        { supplierId: 'SUP-014', unitPrice: 16.1, currency: 'PEN', deliveryDays: 7, paymentTerms: 'CREDITO A 30 DIAS', attachmentName: 'cotizacion-siderperu-0088.pdf', selected: false },
      ] },
    ],
    awardedSupplierId: 'SUP-011', authorizedBy: 'Jorge Salcedo (Jefe de Compras)',
    awardReason: 'Mejor tiempo de entrega y condición de pago para cubrir la Hoja de Trabajo HT-2026-0311 a tiempo.',
  },
  {
    id: 'QT-002', number: 'COT-2026-0091', requisitionId: 'PR-004', status: 'under_evaluation', createdAt: '2026-08-13', dueDate: '2026-08-16',
    lines: [
      { itemId: 'MP00013', quantity: 1200, unitOfMeasure: 'UND', offers: [
        { supplierId: 'SUP-013', unitPrice: 17, currency: 'PEN', deliveryDays: 5, paymentTerms: 'CREDITO A 30 DIAS', attachmentName: 'cotizacion-arequipa-0091.pdf', selected: false },
        { supplierId: 'SUP-014', unitPrice: 16.85, currency: 'PEN', deliveryDays: 4, paymentTerms: 'CREDITO A 30 DIAS', attachmentName: 'cotizacion-siderperu-0091.pdf', selected: false },
      ] },
      { itemId: 'MP00014', quantity: 300, unitOfMeasure: 'UND', offers: [
        { supplierId: 'SUP-013', unitPrice: 3150, currency: 'PEN', deliveryDays: 6, paymentTerms: 'CREDITO A 30 DIAS', selected: false },
      ] },
    ],
  },
  {
    id: 'QT-003', number: 'COT-2026-0079', requisitionId: 'PR-006', status: 'awarded', createdAt: '2026-07-21', dueDate: '2026-07-24',
    lines: [
      { itemId: 'MA00001', quantity: 60, unitOfMeasure: 'KG', offers: [{ supplierId: 'SUP-016', unitPrice: 12.8, currency: 'PEN', deliveryDays: 4, paymentTerms: 'CREDITO A 15 DIAS', selected: true }] },
      { itemId: 'MA00024', quantity: 40, unitOfMeasure: 'KG', offers: [{ supplierId: 'SUP-016', unitPrice: 12.1, currency: 'PEN', deliveryDays: 4, paymentTerms: 'CREDITO A 15 DIAS', selected: true }] },
    ],
    awardedSupplierId: 'SUP-016', authorizedBy: 'Jorge Salcedo (Jefe de Compras)', awardReason: 'Proveedor homologado único para electrodos Solditec.',
  },
  {
    id: 'QT-004', number: 'COT-2026-0093', requisitionId: 'PR-008', status: 'awarded', createdAt: '2026-08-14', dueDate: '2026-08-17',
    lines: [{ itemId: 'MA00031', quantity: 200, unitOfMeasure: 'UND', offers: [
      { supplierId: 'SUP-006', unitPrice: 3.7, currency: 'PEN', deliveryDays: 3, paymentTerms: 'CONTADO', selected: true },
      { supplierId: 'SUP-010', unitPrice: 3.9, currency: 'PEN', deliveryDays: 2, paymentTerms: 'CONTADO', selected: false },
    ] }],
    awardedSupplierId: 'SUP-006', authorizedBy: 'Rosa Injante (Compras)', awardReason: 'Mejor precio, entrega en ventana requerida.',
  },
  {
    id: 'QT-005', number: 'COT-2026-0095', requisitionId: 'PR-003', status: 'sent', createdAt: '2026-08-11', dueDate: '2026-08-15',
    lines: [
      { itemId: 'MP00001', quantity: 60, unitOfMeasure: 'M3', offers: [] },
      { itemId: 'MP00002', quantity: 80, unitOfMeasure: 'M3', offers: [] },
      { itemId: 'MP00003', quantity: 50, unitOfMeasure: 'M3', offers: [] },
    ],
  },
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-001', number: 'OC-2026-0512', quotationId: 'QT-001', supplierId: 'SUP-011', status: 'partially_received',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CREDITO A 15 DIAS', issuedAt: '2026-08-06',
    committedDeliveryDate: '2026-08-09', committedDeliveryTime: '08:00',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega en Almacén Principal, planta Lima. El transporte y descarga son responsabilidad del proveedor. Se exige guía de remisión y certificado de calidad por lote.',
    penalties: '1% del valor de la OC por cada día de atraso, tope 10%.',
    warranty: 'Cambio de bolsas dañadas o con endurecimiento sin costo dentro de las 48h de recepción.',
    notes: 'Entrega parcial autorizada por Compras el 2026-08-08 debido a disponibilidad de flota del proveedor.',
    lines: [{ itemId: 'MP00006', quantity: 600, receivedQuantity: 400, unitOfMeasure: 'BOL', unitPrice: 22 }],
    approvalId: 'APR-002',
  },
  {
    id: 'PO-002', number: 'OC-2026-0513', quotationId: 'QT-001', supplierId: 'SUP-013', status: 'confirmed',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CREDITO A 30 DIAS', issuedAt: '2026-08-06',
    committedDeliveryDate: '2026-08-14', committedDeliveryTime: '09:30',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega en Almacén Principal. Barras deben venir con certificado ASTM A615 vigente.',
    penalties: '0.5% del valor de la OC por día de atraso.',
    warranty: 'No aplica devolución por corte, solo por defecto de fabricación certificado.',
    notes: '',
    lines: [{ itemId: 'MP00011', quantity: 3000, receivedQuantity: 0, unitOfMeasure: 'UND', unitPrice: 16.3 }],
    approvalId: 'APR-002',
  },
  {
    id: 'PO-003', number: 'OC-2026-0509', quotationId: 'QT-003', supplierId: 'SUP-016', status: 'closed',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CREDITO A 15 DIAS', issuedAt: '2026-07-22',
    committedDeliveryDate: '2026-07-26', committedDeliveryTime: '10:00',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega en Almacén Principal — área Soldadura.',
    penalties: 'No aplica (proveedor de confianza, sin incidentes registrados).',
    warranty: 'Cambio de electrodos húmedos o vencidos.',
    notes: 'OC cerrada tras recepción conforme y factura pagada.',
    lines: [
      { itemId: 'MA00001', quantity: 60, receivedQuantity: 60, unitOfMeasure: 'KG', unitPrice: 12.8 },
      { itemId: 'MA00024', quantity: 40, receivedQuantity: 40, unitOfMeasure: 'KG', unitPrice: 12.1 },
    ],
    approvalId: 'APR-001',
  },
  {
    id: 'PO-004', number: 'OC-2026-0514', quotationId: 'QT-004', supplierId: 'SUP-006', status: 'pending_approval',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CONTADO', issuedAt: '2026-08-15',
    committedDeliveryDate: '2026-08-19', committedDeliveryTime: '14:00',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega en Almacén Principal. Pago contra entrega con guía y factura.',
    penalties: 'No aplica.',
    warranty: 'Cambio de tubos rajados o fuera de medida.',
    notes: '',
    lines: [{ itemId: 'MA00031', quantity: 200, receivedQuantity: 0, unitOfMeasure: 'UND', unitPrice: 3.7 }],
    approvalId: 'APR-005',
  },
  {
    id: 'PO-005', number: 'OC-2026-0490', supplierId: 'SUP-018', status: 'confirmed',
    currency: 'USD', exchangeRate: 3.78, paymentTerms: '50% DE ADELANTO CON OC Y SALDO CONTRA ENTREGA', issuedAt: '2026-06-30',
    committedDeliveryDate: '2026-09-10', committedDeliveryTime: '08:00',
    plant: 'Planta Lima',
    termsAndConditions: 'Importación vía marítima, DDP Callao. Incluye instalación y capacitación en planta.',
    penalties: '2% del saldo por semana de atraso sobre la fecha comprometida.',
    warranty: '12 meses contra defectos de fabricación del molde.',
    notes: 'Compra de reposición de moldes de poste — lead time largo, seguimiento mensual de Compras.',
    lines: [{ itemId: 'SU00786', quantity: 4, receivedQuantity: 0, unitOfMeasure: 'UND', unitPrice: 95 }],
  },
  {
    id: 'PO-006', number: 'OC-2026-0475', supplierId: 'SUP-004', status: 'received',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CONTADO', issuedAt: '2026-08-01',
    committedDeliveryDate: '2026-08-03', committedDeliveryTime: '07:00',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega directa en cancha de agregados, Almacén Principal.',
    penalties: 'No aplica.',
    warranty: 'No aplica.',
    notes: '',
    lines: [
      { itemId: 'MP00001', quantity: 40, receivedQuantity: 40, unitOfMeasure: 'M3', unitPrice: 52 },
      { itemId: 'MP00002', quantity: 40, receivedQuantity: 40, unitOfMeasure: 'M3', unitPrice: 55 },
    ],
  },
  {
    id: 'PO-007', number: 'OC-2026-0501', supplierId: 'SUP-015', status: 'draft',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CREDITO A 30 DIAS', issuedAt: '2026-08-15',
    committedDeliveryDate: '2026-08-22', committedDeliveryTime: '10:00',
    plant: 'Planta Lima',
    termsAndConditions: '',
    penalties: '',
    warranty: '',
    notes: 'Pendiente completar términos y condiciones antes de enviar a aprobación.',
    lines: [{ itemId: 'MA00002', quantity: 30, receivedQuantity: 0, unitOfMeasure: 'GAL', unitPrice: 46 }],
  },
  {
    id: 'PO-008', number: 'OC-2026-0460', supplierId: 'SUP-003', status: 'closed',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CREDITO A 30 DIAS', issuedAt: '2026-07-10',
    committedDeliveryDate: '2026-07-16', committedDeliveryTime: '09:00',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega en Almacén Principal.',
    penalties: '1% por día de atraso.',
    warranty: 'Cambio por defecto de material.',
    notes: '',
    lines: [{ itemId: 'SU01122', quantity: 80, receivedQuantity: 80, unitOfMeasure: 'UND', unitPrice: 19 }],
  },
  {
    id: 'PO-009', number: 'OC-2026-0515', supplierId: 'SUP-002', status: 'rejected',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CREDITO A 30 DIAS', issuedAt: '2026-08-16',
    committedDeliveryDate: '2026-08-25', committedDeliveryTime: '09:00',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega en Almacén Principal.',
    penalties: '1% por día de atraso.',
    warranty: 'Cambio por defecto de material.',
    notes: 'Rechazada por Gerencia: excede el crédito disponible del proveedor en este período.',
    lines: [{ itemId: 'MP00013', quantity: 2000, receivedQuantity: 0, unitOfMeasure: 'UND', unitPrice: 17 }],
    approvalId: 'APR-006',
  },
  {
    id: 'PO-010', number: 'OC-2026-0470', supplierId: 'SUP-013', status: 'received',
    currency: 'PEN', exchangeRate: 1, paymentTerms: 'CREDITO A 30 DIAS', issuedAt: '2026-07-28',
    committedDeliveryDate: '2026-08-02', committedDeliveryTime: '08:30',
    plant: 'Planta Lima',
    termsAndConditions: 'Entrega en Almacén Principal.',
    penalties: '0.5% por día de atraso.',
    warranty: 'No aplica devolución por corte.',
    notes: '',
    lines: [{ itemId: 'MP00013', quantity: 1500, receivedQuantity: 1500, unitOfMeasure: 'UND', unitPrice: 16.9 }],
  },
];
