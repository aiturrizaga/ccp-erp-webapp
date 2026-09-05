import { Machine, Mold, WorkCenter } from '@core/models';

export const WORK_CENTERS: WorkCenter[] = [
  { id: 'WC-001', code: 'CT-P02', name: 'Planta 02 · Centrifugado', plant: 'AL01', capacityPerDay: 40, unitOfMeasure: 'UND' },
  { id: 'WC-002', code: 'CT-P03', name: 'Planta 03 · Vaciado ductos', plant: 'AL01', capacityPerDay: 90, unitOfMeasure: 'UND' },
  { id: 'WC-003', code: 'CT-ACC01', name: 'Accesorios 01', plant: 'AL01', capacityPerDay: 60, unitOfMeasure: 'UND' },
];

export const MACHINES: Machine[] = [
  { id: 'MCH-001', code: 'CENT-01', name: 'Centrifugadora 01', plant: 'AL01', workCenterId: 'WC-001', status: 'operativa', lastMaintenanceAt: '2026-07-15', nextMaintenanceAt: '2026-10-15' },
  { id: 'MCH-002', code: 'CENT-02', name: 'Centrifugadora 02', plant: 'AL01', workCenterId: 'WC-001', status: 'mantenimiento', lastMaintenanceAt: '2026-08-30', nextMaintenanceAt: '2026-09-05' },
  { id: 'MCH-003', code: 'VIB-01', name: 'Mesa vibradora 01', plant: 'AL01', workCenterId: 'WC-002', status: 'operativa', lastMaintenanceAt: '2026-06-01', nextMaintenanceAt: '2026-12-01' },
  { id: 'MCH-004', code: 'VIB-02', name: 'Mesa vibradora 02', plant: 'AL01', workCenterId: 'WC-003', status: 'operativa', lastMaintenanceAt: '2026-07-01', nextMaintenanceAt: '2026-11-01' },
];

export const MOLDS: Mold[] = [
  { id: 'MLD-001', code: 'MOL-POSTE-9-01', tipo: 'METALICO', plant: 'AL01', location: 'Planta 02', estado: 'bueno', usageCount: 320, maxUsageCount: 800, compatibleProductIds: ['PROD-001'] },
  { id: 'MLD-002', code: 'MOL-POSTE-9-02', tipo: 'METALICO', plant: 'AL01', location: 'Planta 02', estado: 'malo', usageCount: 780, maxUsageCount: 800, compatibleProductIds: ['PROD-001'] },
  { id: 'MLD-003', code: 'MOL-DUCTO4V-01', tipo: 'METALICO', plant: 'AL01', location: 'Planta 03', estado: 'bueno', usageCount: 410, maxUsageCount: 1000, compatibleProductIds: ['PROD-002'] },
  { id: 'MLD-004', code: 'MOL-CAJA40-01', tipo: 'FIBRA', plant: 'AL01', location: 'Accesorios 01', estado: 'bueno', usageCount: 150, maxUsageCount: 500, compatibleProductIds: ['PROD-004'] },
  { id: 'MLD-005', code: 'MOL-CAJARED-01', tipo: 'FIBRA', plant: 'AL01', location: 'Accesorios 01', estado: 'bueno', usageCount: 95, maxUsageCount: 500, compatibleProductIds: ['PROD-005'] },
  { id: 'MLD-006', code: 'MOL-POSTE-10-01', tipo: 'METALICO', plant: 'AL01', location: 'Planta 02', estado: 'bueno', usageCount: 40, maxUsageCount: 800, compatibleProductIds: ['PROD-006'] },
];
