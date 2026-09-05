/**
 * Calidad in Producción is a configurable protocol engine embedded in operations, not a single final
 * gate: a QualityProtocol is a versioned template of fields that applies to one or more routing
 * operations; a QualityInspection is one instance of a protocol filled in against a run + operation.
 * A failing inspection can trigger a NonConformity (reproceso, scrap or cuarentena).
 */
export type QualityFieldDataType = 'number' | 'text' | 'boolean' | 'select';

export interface QualityField {
  id: string;
  label: string;
  dataType: QualityFieldDataType;
  required: boolean;
  unit?: string;
  expectedValue?: string;
  minRange?: number;
  maxRange?: number;
  options?: string[];
}

export type QualityProtocolStatus = 'active' | 'draft' | 'retired';

export const QUALITY_PROTOCOL_STATUS_LABEL: Record<QualityProtocolStatus, string> = {
  active: 'Vigente',
  draft: 'Borrador',
  retired: 'Retirado',
};

export interface QualityProtocol {
  id: string;
  name: string;
  version: string;
  status: QualityProtocolStatus;
  /** Which operation name(s) / product family this protocol applies to — free text, mockup-simple. */
  appliesToOperations: string[];
  productFamily?: string;
  fields: QualityField[];
}

export interface QualityFieldResult {
  fieldId: string;
  value: string;
  pass: boolean;
}

export type QualityInspectionResult = 'pass' | 'fail' | 'pending';

export const QUALITY_INSPECTION_RESULT_LABEL: Record<QualityInspectionResult, string> = {
  pass: 'Conforme',
  fail: 'No conforme',
  pending: 'Pendiente',
};

export interface QualityInspection {
  id: string;
  protocolId: string;
  workSheetId: string;
  lineId: string;
  runId: string;
  operationName: string;
  inspectedBy: string;
  inspectedAt: string;
  fieldResults: QualityFieldResult[];
  evidenceRefs?: string[];
  overallResult: QualityInspectionResult;
  notes?: string;
}

export type NonConformityDisposition = 'reproceso' | 'scrap' | 'cuarentena';

export const NON_CONFORMITY_DISPOSITION_LABEL: Record<NonConformityDisposition, string> = {
  reproceso: 'Reproceso',
  scrap: 'Scrap',
  cuarentena: 'Cuarentena',
};

export interface NonConformity {
  id: string;
  workSheetId: string;
  lineId: string;
  runId: string;
  operationName: string;
  inspectionId?: string;
  reason: string;
  disposition: NonConformityDisposition;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
