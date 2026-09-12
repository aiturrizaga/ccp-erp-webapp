import {
  InspectionCheckOption,
  InspectionFormat,
  NonConformity,
  QualityInspection,
  QualityProtocol,
} from '@core/models';

export const QUALITY_PROTOCOLS: QualityProtocol[] = [
  {
    id: 'QP-001', name: 'Control de vaciado y centrifugado', version: 'v1.0', status: 'active',
    appliesToOperations: ['Fabricación'], productFamily: 'Postes CAC',
    fields: [
      { id: 'QF-1', label: 'Tiempo de centrifugado', dataType: 'number', required: true, unit: 'min', expectedValue: '12', minRange: 10, maxRange: 15 },
      { id: 'QF-2', label: 'Espesor de pared', dataType: 'number', required: true, unit: 'mm', minRange: 28, maxRange: 35 },
      { id: 'QF-3', label: 'Aspecto superficial uniforme', dataType: 'boolean', required: true },
    ],
  },
  {
    id: 'QP-002', name: 'Liberación final de calidad', version: 'v1.2', status: 'active',
    appliesToOperations: ['Liberación de calidad'], productFamily: 'General',
    fields: [
      { id: 'QF-4', label: 'Resistencia a la rotura', dataType: 'number', required: true, unit: 'kgf', minRange: 190, maxRange: 999 },
      { id: 'QF-5', label: 'Fisuras visibles', dataType: 'boolean', required: true, expectedValue: 'false' },
      { id: 'QF-6', label: 'Dimensiones dentro de tolerancia', dataType: 'boolean', required: true },
      { id: 'QF-7', label: 'Observaciones', dataType: 'text', required: false },
    ],
  },
  {
    id: 'QP-003', name: 'Control de secado', version: 'v1.0', status: 'draft',
    appliesToOperations: ['Secado'], productFamily: 'General',
    fields: [
      { id: 'QF-8', label: 'Humedad residual', dataType: 'number', required: true, unit: '%', minRange: 0, maxRange: 6 },
    ],
  },
];

export const QUALITY_INSPECTIONS: QualityInspection[] = [
  {
    id: 'QI-001', protocolId: 'QP-001', workSheetId: 'HT-2026-0311', lineId: 'HTL-0311-1', runId: 'RUN-0311-1',
    operationName: 'Fabricación', inspectedBy: 'Rosa Injante', inspectedAt: '2026-08-07T14:30:00',
    fieldResults: [
      { fieldId: 'QF-1', value: '12.5', pass: true },
      { fieldId: 'QF-2', value: '31', pass: true },
      { fieldId: 'QF-3', value: 'true', pass: true },
    ],
    overallResult: 'pass',
  },
  {
    id: 'QI-002', protocolId: 'QP-002', workSheetId: 'HT-2026-0311', lineId: 'HTL-0311-1', runId: 'RUN-0311-1',
    operationName: 'Liberación de calidad', inspectedBy: 'Jorge Salcedo', inspectedAt: '2026-08-08T09:00:00',
    fieldResults: [
      { fieldId: 'QF-4', value: '205', pass: true },
      { fieldId: 'QF-5', value: 'false', pass: true },
      { fieldId: 'QF-6', value: 'true', pass: true },
    ],
    overallResult: 'pass',
  },
  {
    id: 'QI-003', protocolId: 'QP-002', workSheetId: 'HT-2026-0303', lineId: 'HTL-0303-1', runId: 'RUN-0303-1',
    operationName: 'Liberación de calidad', inspectedBy: 'Jorge Salcedo', inspectedAt: '2026-08-09T10:15:00',
    fieldResults: [
      { fieldId: 'QF-4', value: '178', pass: false },
      { fieldId: 'QF-5', value: 'true', pass: false },
      { fieldId: 'QF-6', value: 'true', pass: true },
    ],
    overallResult: 'fail',
    notes: 'Fisura visible cerca de la base — se deriva a reproceso.',
  },
  {
    id: 'QI-004', protocolId: 'QP-001', workSheetId: 'HT-2026-0320', lineId: 'HTL-0320-1', runId: 'RUN-0320-1',
    operationName: 'Fabricación', inspectedBy: 'Rosa Injante', inspectedAt: '2026-08-18T14:00:00',
    fieldResults: [
      { fieldId: 'QF-1', value: '13.8', pass: true },
      { fieldId: 'QF-2', value: '26', pass: false },
      { fieldId: 'QF-3', value: 'true', pass: true },
    ],
    overallResult: 'fail',
    notes: 'Espesor de pared por debajo del mínimo (26 mm < 28 mm) en una unidad.',
  },
  {
    id: 'QI-005', protocolId: 'QP-002', workSheetId: 'HT-2026-0320', lineId: 'HTL-0320-1', runId: 'RUN-0320-1',
    operationName: 'Liberación de calidad', inspectedBy: 'Jorge Salcedo', inspectedAt: '2026-08-19T13:00:00',
    fieldResults: [
      { fieldId: 'QF-4', value: '196', pass: true },
      { fieldId: 'QF-5', value: 'true', pass: false },
      { fieldId: 'QF-6', value: 'true', pass: true },
    ],
    overallResult: 'fail',
    notes: 'Fisura leve detectada — unidad derivada a reproceso.',
  },
  {
    id: 'QI-006', protocolId: 'QP-001', workSheetId: 'HT-2026-0320', lineId: 'HTL-0320-1', runId: 'RUN-0320-2',
    operationName: 'Fabricación', inspectedBy: 'Rosa Injante', inspectedAt: '2026-08-20T14:00:00',
    fieldResults: [
      { fieldId: 'QF-1', value: '12.1', pass: true },
      { fieldId: 'QF-2', value: '31', pass: true },
      { fieldId: 'QF-3', value: 'true', pass: true },
    ],
    overallResult: 'pass',
  },
  {
    id: 'QI-007', protocolId: 'QP-002', workSheetId: 'HT-2026-0320', lineId: 'HTL-0320-1', runId: 'RUN-0320-2',
    operationName: 'Liberación de calidad', inspectedBy: 'Jorge Salcedo', inspectedAt: '2026-08-21T13:00:00',
    fieldResults: [
      { fieldId: 'QF-4', value: '210', pass: true },
      { fieldId: 'QF-5', value: 'false', pass: true },
      { fieldId: 'QF-6', value: 'true', pass: true },
    ],
    overallResult: 'pass',
  },
  {
    id: 'QI-008', protocolId: 'QP-001', workSheetId: 'HT-2026-0335', lineId: 'HTL-0335-1', runId: 'RUN-0335-1',
    operationName: 'Fabricación', inspectedBy: 'Rosa Injante', inspectedAt: '2026-08-24T14:00:00',
    fieldResults: [
      { fieldId: 'QF-1', value: '11.9', pass: true },
      { fieldId: 'QF-2', value: '30', pass: true },
      { fieldId: 'QF-3', value: 'true', pass: true },
    ],
    overallResult: 'pass',
  },
  {
    id: 'QI-009', protocolId: 'QP-002', workSheetId: 'HT-2026-0335', lineId: 'HTL-0335-1', runId: 'RUN-0335-1',
    operationName: 'Liberación de calidad', inspectedBy: 'Jorge Salcedo', inspectedAt: '2026-08-25T13:00:00',
    fieldResults: [
      { fieldId: 'QF-4', value: '183', pass: false },
      { fieldId: 'QF-5', value: 'false', pass: true },
      { fieldId: 'QF-6', value: 'false', pass: false },
    ],
    overallResult: 'fail',
    notes: 'Dos unidades con dimensiones fuera de tolerancia.',
  },
  {
    id: 'QI-010', protocolId: 'QP-001', workSheetId: 'HT-2026-1010', lineId: 'HTL-1010-1', runId: 'RUN-1010-1',
    operationName: 'Fabricación', inspectedBy: 'Rosa Injante', inspectedAt: '2026-08-29T14:00:00',
    fieldResults: [
      { fieldId: 'QF-1', value: '12.4', pass: true },
      { fieldId: 'QF-2', value: '33', pass: true },
      { fieldId: 'QF-3', value: 'true', pass: true },
    ],
    overallResult: 'pass',
  },
  {
    id: 'QI-011', protocolId: 'QP-002', workSheetId: 'HT-2026-1010', lineId: 'HTL-1010-1', runId: 'RUN-1010-1',
    operationName: 'Liberación de calidad', inspectedBy: 'Jorge Salcedo', inspectedAt: '2026-08-30T13:00:00',
    fieldResults: [
      { fieldId: 'QF-4', value: '215', pass: true },
      { fieldId: 'QF-5', value: 'false', pass: true },
      { fieldId: 'QF-6', value: 'true', pass: true },
    ],
    overallResult: 'pass',
  },
  {
    id: 'QI-012', protocolId: 'QP-003', workSheetId: 'HT-2026-1010', lineId: 'HTL-1010-1', runId: 'RUN-1010-1',
    operationName: 'Secado', inspectedBy: 'Cristian Espinoza', inspectedAt: '2026-08-29T20:00:00',
    fieldResults: [{ fieldId: 'QF-8', value: '4.2', pass: true }],
    overallResult: 'pass',
    notes: 'Humedad residual dentro de rango.',
  },
  {
    id: 'QI-013', protocolId: 'QP-003', workSheetId: 'HT-2026-0311', lineId: 'HTL-0311-1', runId: 'RUN-0311-1',
    operationName: 'Secado', inspectedBy: 'Alex Vasquez', inspectedAt: '2026-08-07T20:00:00',
    fieldResults: [{ fieldId: 'QF-8', value: '7.1', pass: false }],
    overallResult: 'fail',
    notes: 'Humedad residual sobre el máximo permitido — riesgo de fisuras en Acabado.',
  },
  {
    id: 'QI-014', protocolId: '', workSheetId: 'HT-2026-0311', lineId: '', runId: '',
    operationName: 'Verificación de acero, encofrado, desencofrado y acabados',
    inspectedBy: 'Rosa Injante', inspectedAt: '2026-09-09T11:20:00',
    fieldResults: [], overallResult: 'pass',
    formatId: 'F-053', formatCode: 'F-053', formatName: 'Verificación de acero, encofrado, desencofrado y acabados',
    productIds: ['PROD-001'],
    formResponse: {
      header: {
        workSheetNumber: 'HT-2026-0311', customerName: 'TECSUR S.A.', plant: 'AL01 · Planta 02',
        currentDate: '2026-09-09', products: 'Poste CAC 9/200/2/140/275',
        correlativo: '001', plano: 'EST-2026-114',
      },
      items: {
        A1: 'cumple', A2: 'cumple', A3: 'cumple', A4: 'cumple', A5: 'cumple', A6: 'cumple', A7: 'cumple',
        A8: 'cumple', A9: 'cumple', A10: 'cumple', A11: 'cumple', A12: 'no_aplica', A13: 'cumple',
        B1: 'cumple', B2: 'cumple', B3: 'cumple', B4: 'cumple', B5: 'cumple',
        B6: 'cumple', B7: 'cumple', B8: 'cumple', B9: 'cumple',
        C1: 'cumple', C2: 'cumple', C3: 'cumple', C4: 'cumple', C5: 'cumple',
        C6: 'cumple', C7: 'cumple', C8: 'cumple', C9: 'cumple',
        D1: 'cumple', D2: 'cumple', D3: 'cumple', D4: 'cumple', D5: 'cumple',
        D6: 'cumple', D7: 'cumple', D8: 'cumple', D9: 'cumple',
      },
      fields: {
        'F053-TENC': 'METALICO', 'F053-EMOLDE': 'Bueno', 'F053-CODMOLDE': 'M-092', 'F053-FC': '350',
        'F053-SLUMP': '4.5', 'F053-TCUR': 'Vibrado',
      },
      tables: {},
      notes: 'Verificación previa al vaciado conforme. Molde M-092 en buen estado.',
    },
  },
  {
    id: 'QI-015', protocolId: '', workSheetId: 'HT-2026-0311', lineId: '', runId: '',
    operationName: 'Pruebas de postes',
    inspectedBy: 'Jorge Salcedo', inspectedAt: '2026-09-10T15:40:00',
    fieldResults: [], overallResult: 'pass',
    formatId: 'F-056', formatCode: 'F-056', formatName: 'Pruebas de postes',
    productIds: ['PROD-001'],
    formResponse: {
      header: {
        cliente: 'TECSUR S.A.', ht: 'HT-2026-0311', obra: 'Ampliación red MT 13.2 kV', contrato: 'CTO-TECSUR-2026-014',
        cantidad: '3', fecha: '2026-09-10', tipoPoste: '8.00/200/120/240', coefSeguridad: '2.0',
        cargaTrabajo: '100', cargaRotura: '200', longitudUtil: '8.00', deformMax: '—',
        deformPerm: '—', empotramiento: '1.20',
      },
      items: {}, fields: {},
      tables: {
        'M-056': [
          { cells: { pctCarga: '10%', cargaKg: '20', resultado: 'C' } },
          { cells: { pctCarga: '30%', cargaKg: '60', resultado: 'C' } },
          { cells: { pctCarga: '50%', cargaKg: '100', resultado: 'C' } },
          { cells: { pctCarga: '80%', cargaKg: '160', resultado: 'C' } },
          { cells: { pctCarga: '100%', cargaKg: '200', resultado: 'C' } },
          { cells: { pctCarga: 'ROTURA', cargaKg: '205', resultado: 'C' } },
        ],
      },
      notes: 'Pruebas realizadas según NTP-339-027/2002. Los postes cumplen con las cargas nominales.',
    },
  },
];

export const NON_CONFORMITIES: NonConformity[] = [
  {
    id: 'NC-001', workSheetId: 'HT-2026-0303', lineId: 'HTL-0303-1', runId: 'RUN-0303-1',
    operationName: 'Liberación de calidad', inspectionId: 'QI-003',
    reason: 'Fisura visible y resistencia a la rotura por debajo del mínimo (178 kgf < 190 kgf).',
    disposition: 'reproceso', resolved: false, createdAt: '2026-08-09T10:20:00',
  },
  {
    id: 'NC-002', workSheetId: 'HT-2026-0320', lineId: 'HTL-0320-1', runId: 'RUN-0320-1',
    operationName: 'Liberación de calidad', inspectionId: 'QI-005',
    reason: 'Unidad con fisura leve detectada en liberación de calidad.',
    disposition: 'reproceso', resolved: false, createdAt: '2026-08-19T13:05:00',
  },
  {
    id: 'NC-003', workSheetId: 'HT-2026-0335', lineId: 'HTL-0335-1', runId: 'RUN-0335-1',
    operationName: 'Liberación de calidad', inspectionId: 'QI-009',
    reason: 'Dos unidades con dimensiones fuera de tolerancia.',
    disposition: 'reproceso', resolved: true, createdAt: '2026-08-25T13:05:00', resolvedAt: '2026-08-26T09:00:00', resolvedBy: 'Jorge Salcedo',
  },
];

/** Opciones ternarias comunes de la planilla F-053. */
const CHECK_TER: InspectionCheckOption[] = [
  { value: 'cumple', label: 'CUMPLE', satisfies: true },
  { value: 'no_cumple', label: 'NO CUMPLE', satisfies: false },
  { value: 'no_aplica', label: 'NO APLICA' },
];

/** Opciones binarias Bueno/Defectuoso — inspección visual F-057. */
const CHECK_BUENO: InspectionCheckOption[] = [
  { value: 'bueno', label: 'BUENO', satisfies: true },
  { value: 'defectuoso', label: 'DEFECTUOSO', satisfies: false },
];

const CHECK_ACEPTABLE: InspectionCheckOption[] = [
  { value: 'aceptable', label: 'ACEPTABLE', satisfies: true },
  { value: 'inaceptable', label: 'INACEPTABLE', satisfies: false },
];

/**
 * Formatos de inspección CCP — plantillas maestras digitalizadas de los Excel en
 * `D:\info\Downloads\ccp-inspecciones`. Dato maestro fixture-only (igual que QUALITY_PROTOCOLS);
 * las inspecciones que los usan persisten vía `quality_inspections` (todo en `data jsonb`).
 * El resultado general de la inspección es SIEMPRE manual — `satisfies` es solo informativo.
 */
export const INSPECTION_FORMATS: InspectionFormat[] = [
  {
    id: 'F-053',
    code: 'F-053',
    name: 'Verificación de acero, encofrado, desencofrado y acabados',
    description: 'F-053 · v01 — Verificación previa, durante y posterior al vaciado de elementos de C.A.C.',
    headerFields: [
      { id: 'workSheetNumber', label: 'HT', control: 'text', auto: 'workSheetNumber' },
      { id: 'customerName', label: 'Cliente', control: 'text', auto: 'customerName' },
      { id: 'products', label: 'Producto', control: 'text', auto: 'products' },
      { id: 'plant', label: 'Planta N°', control: 'text', auto: 'plant' },
      { id: 'currentDate', label: 'Fecha Inicial', control: 'date', auto: 'currentDate' },
      { id: 'correlativo', label: 'N° Correlativo', control: 'text' },
      { id: 'plano', label: 'Plano de Referencia', control: 'text' },
    ],
    sections: [
      {
        kind: 'items', id: 'A', title: '3. Verificación de Acero', options: CHECK_TER,
        items: [
          { id: 'A1', label: 'Limpieza previa.' },
          { id: 'A2', label: 'Diámetro y distribución del acero según planos.' },
          { id: 'A3', label: 'Longitud de varillas.' },
          { id: 'A4', label: 'Ubicación de traslapes y longitud.' },
          { id: 'A5', label: 'Distribución y espesor de las rondanas.' },
          { id: 'A6', label: 'Longitud y diámetro de estribos (anillos).' },
          { id: 'A7', label: 'Soldadura de estribos (anillos).' },
          { id: 'A8', label: 'Espaciamiento de estribos (anillos).' },
          { id: 'A9', label: 'Amarre de estribos.' },
          { id: 'A10', label: 'Espiralado de la canastilla.' },
          { id: 'A11', label: 'Acero para postes.' },
          { id: 'A12', label: 'Acero para accesorios.' },
          { id: 'A13', label: 'Limpieza final.' },
        ],
      },
      {
        kind: 'items', id: 'B', title: '4. Verificación de Encofrado', options: CHECK_TER,
        items: [
          { id: 'B1', label: 'Ubicación del molde sobre el caballete.' },
          { id: 'B2', label: 'Limpieza de formas del molde.' },
          { id: 'B3', label: 'Aplicación de desmoldante.' },
          { id: 'B4', label: 'Colocación de canastilla de refuerzo.' },
          { id: 'B5', label: 'Colocación y aseguramiento de pines.' },
          { id: 'B6', label: 'Vaciado de concreto.' },
          { id: 'B7', label: 'Encuentro de BASE - TAPA.' },
          { id: 'B8', label: 'Colocación de alineadores pasantes.' },
          { id: 'B9', label: 'Ubicación y ajuste de pernos.' },
        ],
      },
      {
        kind: 'fields', id: 'ENCOF', title: 'Datos del encofrado',
        fields: [
          { id: 'F053-TENC', label: 'Tipo de encofrado', control: 'select', options: ['METALICO', 'MADERA'], required: true },
          { id: 'F053-EMOLDE', label: 'Estado del molde', control: 'select', options: ['Bueno', 'Malo'], required: true },
          { id: 'F053-CODMOLDE', label: 'Código de molde', control: 'text' },
        ],
      },
      {
        kind: 'fields', id: 'CONC', title: '5. Características del Concreto',
        fields: [
          { id: 'F053-FC', label: "Resistencia f'c", control: 'number', unit: 'kg/cm²', required: true, placeholder: '350 / 210' },
          { id: 'F053-SLUMP', label: 'SLUMP', control: 'number', unit: 'cm', required: true },
        ],
      },
      {
        kind: 'items', id: 'C', title: '6. Control de Post-vaciado', options: CHECK_TER,
        items: [
          { id: 'C1', label: 'Colocación de molde en la centrifugadora.' },
          { id: 'C2', label: 'Revisión de ruedas MOLDE.' },
          { id: 'C3', label: 'Revisión de ruedas CENTRIFUGADORA.' },
          { id: 'C4', label: 'Tiempo de centrifugado.' },
          { id: 'C5', label: 'Traslado de molde al área de secado.' },
          { id: 'C6', label: 'Curado del producto.' },
          { id: 'C7', label: 'Desencofrado.' },
          { id: 'C8', label: 'Concreto no presenta cangrejeras.' },
          { id: 'C9', label: 'Tipo de curado', hint: 'Norma: Vibrado' },
        ],
      },
      {
        kind: 'fields', id: 'CUR', title: 'Tipo de curado',
        fields: [
          { id: 'F053-TCUR', label: 'Tipo de curado', control: 'select', options: ['Vibrado', 'Curado externo'], required: true },
        ],
      },
      {
        kind: 'items', id: 'D', title: '7. Acabados', options: CHECK_TER,
        items: [
          { id: 'D1', label: 'Bañado con agua en su totalidad.' },
          { id: 'D2', label: 'Rasqueteo y limpieza de las juntas (costura).' },
          { id: 'D3', label: 'Apertura y verificación de agujeros.' },
          { id: 'D4', label: 'Pulido de concreto.' },
          { id: 'D5', label: 'Acabados en la punta y base del poste.' },
          { id: 'D6', label: 'Impermeabilización y/o sellador.' },
          { id: 'D7', label: 'Pintado de rotulado del producto.' },
          { id: 'D8', label: 'Limpieza del elemento.' },
          { id: 'D9', label: 'Almacenamiento.' },
        ],
      },
    ],
    signatureCount: 2,
    notesPlaceholder: 'Observaciones…',
  },
  {
    id: 'F-054',
    code: 'F-054',
    name: 'Protocolo de concreto',
    description: 'F-054 · v00 — Características del concreto y probetas por HT.',
    headerFields: [
      { id: 'tipoConcreto', label: 'Tipo de concreto', control: 'select', options: ["Concreto Convencional F'c= 100kg/cm2", "Concreto Convencional F'c= 175kg/cm2", "Concreto Convencional F'c= 210kg/cm2", "Concreto Convencional F'c= 350kg/cm2"] },
      { id: 'customerName', label: 'Cliente', control: 'text', auto: 'customerName' },
      { id: 'currentDate', label: 'Fecha', control: 'date', auto: 'currentDate' },
      { id: 'ht', label: 'HT', control: 'text', auto: 'workSheetNumber' },
      { id: 'plant', label: 'Planta N°', control: 'text', auto: 'plant' },
    ],
    sections: [
      {
        kind: 'table', id: 'CONC', title: 'II. Características del Concreto',
        table: {
          dynamic: true, defaultRows: 3,
          columns: [
            { id: 'item', label: 'ITEM', control: 'text', auto: 'sequence', width: '60px' },
            { id: 'cliente', label: 'CLIENTE', control: 'text', width: '140px' },
            { id: 'ht', label: 'HT', control: 'text', width: '100px' },
            { id: 'planta', label: 'PLANTA N°', control: 'text', width: '80px' },
            { id: 'producto', label: 'PRODUCTO', control: 'text', width: '220px' },
            { id: 'nmuestras', label: 'N° MUESTRAS (PROB)', control: 'number', width: '130px' },
            { id: 'codProbeta', label: 'CÓDIGO DE PROBETA', control: 'text', width: '160px' },
            { id: 'tInicio', label: 'T. INICIO', control: 'text', width: '80px' },
            { id: 'tFin', label: 'T. FIN', control: 'text', width: '80px' },
          ],
        },
      },
    ],
    signatureCount: 3,
    notesPlaceholder: 'Observaciones…',
  },
  {
    id: 'F-056',
    code: 'F-056',
    name: 'Pruebas de postes',
    description: 'F-056 · v00 — Protocolo de prueba de postes C.A.C. según NTP-339-027/2002.',
    headerFields: [
      { id: 'cliente', label: 'Cliente', control: 'text' },
      { id: 'ht', label: 'HT', control: 'text' },
      { id: 'obra', label: 'Obra', control: 'text' },
      { id: 'contrato', label: 'Contrato', control: 'text' },
      { id: 'cantidad', label: 'Cantidad', control: 'number' },
      { id: 'fecha', label: 'Fecha de prueba', control: 'date' },
      { id: 'tipoPoste', label: 'Tipo de poste', control: 'text' },
      { id: 'coefSeguridad', label: 'Coeficiente de seguridad', control: 'number' },
      { id: 'cargaTrabajo', label: 'Carga de trabajo', control: 'number', unit: 'Kg' },
      { id: 'cargaRotura', label: 'Carga de rotura', control: 'number', unit: 'Kg' },
      { id: 'longitudUtil', label: 'Longitud útil', control: 'number', unit: 'm' },
      { id: 'deformMax', label: 'Deformación máxima', control: 'number', unit: 'mm' },
      { id: 'deformPerm', label: 'Deformación permanente', control: 'number', unit: 'mm' },
      { id: 'empotramiento', label: 'Empotramiento', control: 'number', unit: 'm' },
    ],
    sections: [
      {
        kind: 'table', id: 'M-056', title: 'Prueba de carga de trabajo y de rotura',
        table: {
          dynamic: true,
          columns: [
            { id: 'pctCarga', label: '% CARGA', control: 'text', auto: 'prefill', prefill: ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%', 'ROTURA'], width: '90px' },
            { id: 'muestra', label: 'MUESTRA', control: 'text', width: '70px' },
            { id: 'cargaKg', label: 'CARGA (Kg)', control: 'number', width: '90px' },
            { id: 'resultado', label: 'RESULTADO', control: 'select', options: ['C', 'f.', 'f.r.'], width: '90px' },
            { id: 'obs', label: 'OBSERVACIONES', control: 'text' },
          ],
        },
      },
    ],
    signatureCount: 1,
    notesPlaceholder: 'Observaciones… Se registran las lecturas de deformación por muestra según la norma.',
    note: 'Las pruebas se realizan de acuerdo a la Norma Técnica Peruana N.T.P.-339-027/2002. Resultado: C = conforme · f. = falla · f.r. = falla en rotura.',
  },
  {
    id: 'F-057',
    code: 'F-057',
    name: 'Pruebas de accesorios',
    description: 'F-057 · v00 — Protocolo de pruebas de accesorios (ménsulas, plataformas, crucetas, ductos, etc.). Plantilla flexible.',
    headerFields: [
      { id: 'products', label: 'Producto', control: 'text', auto: 'products' },
      { id: 'customerName', label: 'Cliente', control: 'text', auto: 'customerName' },
      { id: 'ht', label: 'HT', control: 'text', auto: 'workSheetNumber' },
      { id: 'currentDate', label: 'Fecha', control: 'date', auto: 'currentDate' },
      { id: 'cantidad', label: 'Cantidad', control: 'number' },
      { id: 'obra', label: 'Obra', control: 'text' },
      { id: 'contrato', label: 'Contrato', control: 'text' },
    ],
    sections: [
      {
        kind: 'items', id: 'VIS', title: 'A. Inspección Visual', options: CHECK_BUENO,
        items: [
          { id: 'VIS1', label: 'a. Estado general del accesorio.' },
          { id: 'VIS2', label: 'b. Uniformidad del acabado superficial.' },
        ],
      },
      {
        kind: 'items', id: 'RES', title: 'Resultados', options: CHECK_ACEPTABLE,
        items: [{ id: 'RES1', label: 'Resultado de la inspección visual.' }],
      },
      {
        kind: 'table', id: 'DIM', title: 'B. Inspección Dimensional',
        table: {
          dynamic: true,
          columns: [
            { id: 'item', label: 'ITEM', control: 'text', auto: 'sequence', width: '60px' },
            { id: 'dimension', label: 'DIMENSIÓN', control: 'text', width: '170px' },
            { id: 'tolerancia', label: 'TOLERANCIA', control: 'text', width: '90px' },
            { id: 'nominal', label: 'NOMINAL', control: 'number', width: '90px' },
            { id: 'verificada', label: 'VERIFICADA', control: 'number', width: '90px' },
            { id: 'resultado', label: 'RESULTADO', control: 'select', options: ['Aceptable', 'Inaceptable'], width: '120px' },
          ],
        },
      },
      {
        kind: 'table', id: 'CT', title: 'C. Prueba a carga de trabajo y de rotura',
        table: {
          dynamic: true,
          columns: [
            { id: 'pctCarga', label: '% CARGA', control: 'text', auto: 'prefill', prefill: ['20%', '40%', '60%', '80%', '100%', 'ROTURA'], width: '90px' },
            { id: 'cargaT', label: 'CARGA T (Kg)', control: 'number', width: '110px' },
            { id: 'cargaT2', label: 'CARGA F (Kg)', control: 'number', width: '110px' },
            { id: 'cargaT3', label: 'CARGA V (Kg)', control: 'number', width: '110px' },
            { id: 'obs', label: 'OBSERVACIONES', control: 'text' },
          ],
        },
      },
      {
        kind: 'fields', id: 'FAB', title: 'D. Fabricación',
        fields: [
          { id: 'F057-SIST', label: 'Sistema', control: 'text', placeholder: 'Vibrado' },
          { id: 'F057-RECUB', label: 'Recubrimiento', control: 'text' },
        ],
      },
      {
        kind: 'fields', id: 'CONCL', title: 'E. Conclusión',
        fields: [
          { id: 'F057-COND', label: 'Condición del material', control: 'select', options: ['Aceptado', 'Rechazado'] },
          { id: 'F057-RESU', label: 'Resultados', control: 'select', options: ['Cumple', 'No cumple'] },
          { id: 'F057-CONC', label: 'Conclusiones', control: 'textarea' },
        ],
      },
    ],
    signatureCount: 1,
    notesPlaceholder: 'Observaciones…',
  },
  {
    id: 'F-058',
    code: 'F-058',
    name: 'Acta de inspección',
    description: 'F-058 · v00 — Acta de inspección de bloques de concreto y elementos C.A.C.',
    headerFields: [
      { id: 'currentDate', label: 'Fecha', control: 'date', auto: 'currentDate' },
      { id: 'plant', label: 'Planta', control: 'text', auto: 'plant' },
      { id: 'customerName', label: 'Cliente', control: 'text', auto: 'customerName' },
      { id: 'orderNum', label: 'Orden de compra / Acuerdo', control: 'text' },
      { id: 'tt', label: 'HT', control: 'text', auto: 'workSheetNumber' },
    ],
    sections: [
      {
        kind: 'fields', id: 'ACTA', title: 'Acta',
        fields: [
          { id: 'F058-TXT', label: 'Texto del acta', control: 'textarea', placeholder: 'En la ciudad de … siendo las … del día …, entre los representantes de la empresa CCP S.A.C. y el cliente …, se acordó el presente documento de inspección de bloques de concreto, conforme a la orden de compra …' },
        ],
      },
      {
        kind: 'table', id: 'DET', title: 'Detalle del lote inspeccionado',
        table: {
          dynamic: true, defaultRows: 3,
          columns: [
            { id: 'item', label: 'ITEM', control: 'text', auto: 'sequence', width: '60px' },
            { id: 'descripcion', label: 'DESCRIPCIÓN', control: 'text', width: '240px' },
            { id: 'und', label: 'UND', control: 'text', width: '80px' },
            { id: 'cantidad', label: 'CANTIDAD', control: 'number', width: '100px' },
            { id: 'cotizacion', label: 'COTIZACIÓN N°', control: 'text', width: '130px' },
          ],
        },
      },
    ],
    signatureCount: 2,
    notesPlaceholder: 'Notas y documentos anexos…',
  },
];
