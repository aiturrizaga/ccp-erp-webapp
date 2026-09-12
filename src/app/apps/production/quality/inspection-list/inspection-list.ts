import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmComboboxImports } from '@ui/combobox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { QualityInspection, QualityInspectionResult, QUALITY_INSPECTION_RESULT_LABEL, Tone, WorkSheet, WorkSheetStatus, WORK_SHEET_STATUS_LABEL, workSheetStatus } from '@core/models';
import { ProductionState } from '../../production-state';
import { newestFirst } from '@core/utils/sort';

const RESULT_TONE: Record<QualityInspectionResult, Tone> = {
  pass: 'success',
  fail: 'danger',
  pending: 'neutral',
};

const STATUS_TONE: Record<WorkSheetStatus, Tone> = {
  planned: 'neutral',
  released: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'customer', label: 'Cliente' },
];

/** Fila de listado: el registro de inspección + campos derivados de su HT (cliente, estado) y de su formato/productos. */
interface InspectionRow {
  inspection: QualityInspection;
  ws: WorkSheet | null;
  customerName: string;
  wsStatus: WorkSheetStatus | null;
  formatLabel: string;
  productsLabel: string;
}

@Component({
  selector: 'app-inspection-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmComboboxImports, DataTable, ListToolbar, StatusBadge],
  templateUrl: './inspection-list.html',
})
export class InspectionList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');
  protected readonly customerFilter = signal('');
  protected readonly customerSearch = signal('');
  protected readonly groupBy = signal('none');
  protected readonly expandedId = signal<string | null>(null);

  protected readonly groupByOptions = GROUP_BY_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'format', header: 'Formato', width: '230px' },
    { key: 'workSheetId', header: 'HT', width: '120px' },
    { key: 'customerName', header: 'Cliente' },
    { key: 'products', header: 'Producto(s)', width: '190px' },
    { key: 'wsStatus', header: 'Estado HT', width: '130px' },
    { key: 'inspectedBy', header: 'Inspeccionado por' },
    { key: 'inspectedAt', header: 'Fecha', width: '120px' },
    { key: 'overallResult', header: 'Resultado', width: '120px' },
  ];

  private readonly workSheetIndex = computed(() => {
    const map = new Map<string, WorkSheet>();
    for (const ws of this.productionState.workSheets()) map.set(ws.id, ws);
    return map;
  });

  private readonly rows = computed<InspectionRow[]>(() =>
    this.productionState.qualityInspections().map((inspection) => {
      const ws = this.workSheetIndex().get(inspection.workSheetId) ?? null;
      return {
        inspection,
        ws,
        customerName: ws?.customerName || '—',
        wsStatus: ws ? workSheetStatus(ws) : null,
        formatLabel: this.formatName(inspection),
        productsLabel: this.productNames(inspection),
      };
    }),
  );

  /** Clientes presentes en las inspecciones (deduplicados por nombre desde la HT), filtrables por el texto tecleado. */
  protected readonly customerOptions = computed<{ value: string; label: string }[]>(() => {
    const query = this.customerSearch().trim().toLowerCase();
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const row of this.rows()) {
      const name = row.customerName;
      if ((query && !name.toLowerCase().includes(query)) || seen.has(name)) continue;
      seen.add(name);
      options.push({ value: name, label: name });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  });

  /** Badge que reemplaza al combobox una vez hay un cliente seleccionado. */
  protected readonly customerBadge = computed<string | null>(() => this.customerFilter() || null);

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const customer = this.customerFilter();
    const list = this.rows().filter((r) => {
      const matchesSearch =
        !term ||
        r.inspection.workSheetId.toLowerCase().includes(term) ||
        r.formatLabel.toLowerCase().includes(term) ||
        r.productsLabel.toLowerCase().includes(term);
      const matchesCustomer = !customer || r.customerName === customer;
      return matchesSearch && matchesCustomer;
    });
    return newestFirst(list, (r) => r.inspection.inspectedAt);
  });

  protected readonly groupedSections = computed<{ label: string; rows: InspectionRow[] }[] | null>(() => {
    if (this.groupBy() === 'none') return null;
    const groups = new Map<string, InspectionRow[]>();
    for (const row of this.filteredRows()) {
      const key = row.customerName;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  /** Todas las inspecciones de la misma HT que `workSheetId` (incluida la del propio registro). */
  protected inspectionsOfHt(workSheetId: string): InspectionRow[] {
    return this.rows().filter((r) => r.inspection.workSheetId === workSheetId);
  }

  protected readonly isRowExpanded = (row: InspectionRow): boolean => row.inspection.id === this.expandedId();

  /** Nombre del formato o fallback al nombre del protocolo legacy. */
  protected formatName(inspection: QualityInspection): string {
    if (inspection.formatName) return inspection.formatCode ? `${inspection.formatCode} · ${inspection.formatName}` : inspection.formatName;
    return this.protocolName(inspection);
  }

  /** Protocolo legacy para inspecciones sin formato. */
  protected protocolName(inspection: QualityInspection): string {
    return this.productionState.qualityProtocols().find((p) => p.id === inspection.protocolId)?.name ?? inspection.protocolId;
  }

  /** Nombres de productos de la inspección (multi-producto o fallback "—"). */
  protected productNames(inspection: QualityInspection): string {
    const ids = inspection.productIds ?? [];
    if (!ids.length) return '—';
    return ids.map((id) => this.productionState.products().find((p) => p.id === id)?.name ?? id).join(', ');
  }

  protected resultLabel(inspection: QualityInspection): string {
    return QUALITY_INSPECTION_RESULT_LABEL[inspection.overallResult];
  }

  protected resultTone(inspection: QualityInspection): Tone {
    return RESULT_TONE[inspection.overallResult];
  }

  protected statusLabel(status: WorkSheetStatus): string {
    return WORK_SHEET_STATUS_LABEL[status];
  }

  protected statusTone(status: WorkSheetStatus): Tone {
    return STATUS_TONE[status];
  }

  protected onCustomerChange(value: string | null | undefined): void {
    this.customerFilter.set(value ?? '');
  }

  protected clearCustomerFilter(): void {
    this.customerFilter.set('');
    this.customerSearch.set('');
  }

  protected customerPickerToString = (val: string): string => val;

  protected toggleExpand(row: InspectionRow): void {
    this.expandedId.set(this.expandedId() === row.inspection.id ? null : row.inspection.id);
  }

  protected openDetail(row: InspectionRow): void {
    this.router.navigate(['/apps/production/quality/inspections', row.inspection.id]);
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/quality/inspections/new']);
  }
}