import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { CrmState } from '@apps/crm/crm-state';
import { Tone } from '@core/models';
import { Lead, LeadSource, LeadStatus, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from '@core/models/crm.model';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'discarded', label: 'Descartado' },
];

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'web', label: 'Sitio web' },
  { value: 'referral', label: 'Referido' },
  { value: 'trade_show', label: 'Feria comercial' },
  { value: 'call', label: 'Llamada entrante' },
  { value: 'other', label: 'Otro' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'source', label: 'Origen' },
];

@Component({
  selector: 'app-lead-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './lead-list.html',
})
export class LeadList {
  private readonly router = inject(Router);
  private readonly crmState = inject(CrmState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<LeadStatus>>(new Set());
  protected readonly sourceFilter = signal<Set<LeadSource>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly sourceOptions = SOURCE_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'company', header: 'Empresa' },
    { key: 'contactName', header: 'Contacto', width: '20%' },
    { key: 'source', header: 'Origen', width: '140px' },
    { key: 'status', header: 'Estado', width: '130px' },
    { key: 'createdAt', header: 'Creado', width: '110px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const sources = this.sourceFilter();
    return this.crmState.leads().filter((l) => {
      const matchesSearch = !term || l.company.toLowerCase().includes(term) || l.contactName.toLowerCase().includes(term) || l.email.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(l.status);
      const matchesSource = sources.size === 0 || sources.has(l.source);
      return matchesSearch && matchesStatus && matchesSource;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.sourceFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Lead[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Lead[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : this.sourceLabel(row.source);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: LeadStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleSourceFilter(value: LeadSource): void {
    this.sourceFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.sourceFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected statusLabel(status: LeadStatus): string {
    return LEAD_STATUS_LABEL[status];
  }

  protected statusTone(status: LeadStatus): Tone {
    return LEAD_STATUS_TONE[status];
  }

  protected sourceLabel(source: LeadSource): string {
    return LEAD_SOURCE_LABEL[source];
  }

  protected openDetail(lead: Lead): void {
    this.router.navigate(['/apps/crm/leads', lead.id]);
  }
}
