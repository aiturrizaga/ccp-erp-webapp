import { NonConformity, QualityInspection, QualityProtocol } from '@core/models';

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
];

export const NON_CONFORMITIES: NonConformity[] = [
  {
    id: 'NC-001', workSheetId: 'HT-2026-0303', lineId: 'HTL-0303-1', runId: 'RUN-0303-1',
    operationName: 'Liberación de calidad', inspectionId: 'QI-003',
    reason: 'Fisura visible y resistencia a la rotura por debajo del mínimo (178 kgf < 190 kgf).',
    disposition: 'reproceso', resolved: false, createdAt: '2026-08-09T10:20:00',
  },
];
