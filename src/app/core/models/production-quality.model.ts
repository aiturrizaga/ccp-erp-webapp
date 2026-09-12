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
  // ===== Formato CCP (F-053…F-058) — opcional: solo lo llenan las inspecciones por formato.
  // ===== Las inspecciones legacy por protocolo (protocolId 'QP-xxx') no usan estos campos. =====
  formatId?: string;
  /** Denormalizado para el listado/detalle sin lookup del formato maestro. */
  formatCode?: string;
  formatName?: string;
  /** Productos de la HT incluidos en esta inspección (multi-producto). */
  productIds?: string[];
  /** Respuestas capturadas del formulario — presente solo en inspecciones por formato. */
  formResponse?: InspectionFormResponse;
}

// ---------------------------------------------------------------------------
// Formatos de inspección CCP (F-053, F-054, F-056, F-057, F-058)
// ---------------------------------------------------------------------------
// A form is a template of ordered sections rendered dynamically by `kind`. Sections are items
// (checklist con opciones CUMPLE/NO CUMPLE/NO APLICA…), fields (inputs libres) or tables (filas
// dinámicas editables). El resultado general es SIEMPRE manual (Conforme/No conforme/Pendiente) —
// `satisfies` en las opciones es solo informativo, nunca auto-evalúa.

export interface InspectionCheckOption {
  value: string; // 'cumple' | 'no_cumple' | 'no_aplica' | 'bueno' | 'defectuoso' | 'aceptable' | 'inaceptable'
  label: string; // 'CUMPLE' | 'NO CUMPLE' | 'NO APLICA' | …
  /** true = conforme, false = no conforme, undefined = neutro. Informativo — el resultado es manual. */
  satisfies?: boolean;
}

export interface InspectionSectionItem {
  id: string; // 'A1'…'A13', 'B1'…'B9', …
  label: string;
  hint?: string;
}

export interface InspectionSectionField {
  id: string;
  label: string;
  control: 'text' | 'number' | 'select' | 'textarea';
  options?: string[]; // para 'select'
  required?: boolean;
  unit?: string; // para number
  placeholder?: string;
}

export interface InspectionTableColumn {
  id: string;
  label: string;
  control: 'text' | 'number' | 'select';
  options?: string[]; // para 'select' (p.ej. Resultado Aceptable/Inaceptable)
  /** 'sequence' → la celda se auto-cuenta (ITEM 01, ITEM 02…) · 'prefill' → consume `prefill` por fila generada. */
  auto?: 'sequence' | 'prefill';
  prefill?: string[]; // p.ej. '% Carga': ['10%','20%',…,'100%','ROTURA']
  width?: string;
}

export interface InspectionSectionTable {
  dynamic: boolean; // false → tabla de solo lectura/estática
  columns: InspectionTableColumn[];
  defaultRows?: number; // filas iniciales para tablas dinámicas
}

/** Unión discriminada por `kind` — el render dinámico hace @switch por sección. */
export type InspectionSection =
  | { kind: 'items'; id: string; title: string; options: InspectionCheckOption[]; items: InspectionSectionItem[] }
  | { kind: 'fields'; id: string; title: string; fields: InspectionSectionField[] }
  | { kind: 'table'; id: string; title: string; table: InspectionSectionTable };

export interface InspectionFormatHeaderField {
  id: string;
  label: string;
  control: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  /** Unidad mostrada junto a la etiqueta para inputs numéricos del encabezado. */
  unit?: string;
  /** 'auto' → no editable, se deriva al llenar desde la HT/productos/fecha. */
  auto?: 'workSheetNumber' | 'customerName' | 'plant' | 'currentDate' | 'products';
}

export interface InspectionFormat {
  id: string; // 'F-053'
  code: string; // 'F-053'
  name: string;
  description?: string;
  headerFields: InspectionFormatHeaderField[];
  sections: InspectionSection[];
  signatureCount: number; // 1 (F-056/F-057), 2 (F-053/F-058), 3 (F-054)
  notesPlaceholder?: string;
  /** Texto fijo renderizado bajo el formulario (p.ej. norma NTP en F-056). */
  note?: string;
}

export interface InspectionFormRow {
  cells: Record<string, string>; // columnId → valor (el _uid local se descarta al guardar)
}

export interface InspectionFormResponse {
  header: Record<string, string>; // headerField.id → valor (autos resueltos + editados)
  items: Record<string, string>; // itemId → valor de la opción elegida
  fields: Record<string, string>; // fieldId → valor
  tables: Record<string, InspectionFormRow[]>; // tableId → filas
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
