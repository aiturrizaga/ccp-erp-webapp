import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { DataKanban, KanbanColumn } from '@shared/components/data-kanban/data-kanban';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { CrmState } from '@apps/crm/crm-state';
import { CUSTOMERS } from '@core/mock-data/crm.fixture';
import { Tone } from '@core/models';
import { Opportunity, OpportunityStage, OPPORTUNITY_STAGE_LABEL, OPPORTUNITY_STAGE_TONE } from '@core/models/crm.model';

const STAGE_ORDER: OpportunityStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const STAGE_OPTIONS: { value: OpportunityStage; label: string }[] = STAGE_ORDER.map((value) => ({ value, label: OPPORTUNITY_STAGE_LABEL[value] }));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'stage', label: 'Etapa' },
  { value: 'salesRep', label: 'Vendedor' },
];

@Component({
  selector: 'app-opportunity-list',
  imports: [NgIcon, DecimalPipe, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './opportunity-list.html',
})
export class OpportunityList {
  private readonly router = inject(Router);
  private readonly crmState = inject(CrmState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('kanban');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly stageFilter = signal<Set<OpportunityStage>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.kanban, LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly stageOptions = STAGE_OPTIONS;

  protected readonly stageColumns: KanbanColumn[] = STAGE_ORDER.map((value) => ({ value, label: OPPORTUNITY_STAGE_LABEL[value], tone: OPPORTUNITY_STAGE_TONE[value] }));
  protected readonly stageKey = (row: Opportunity): string => row.stage;

  protected readonly columns: DataTableColumn[] = [
    { key: 'title', header: 'Oportunidad' },
    { key: 'customer', header: 'Cliente', width: '22%' },
    { key: 'expectedAmount', header: 'Monto esperado', width: '150px' },
    { key: 'stage', header: 'Etapa', width: '130px' },
    { key: 'estimatedCloseDate', header: 'Cierre estimado', width: '130px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const stages = this.stageFilter();
    return this.crmState.opportunities().filter((o) => {
      const matchesSearch = !term || o.title.toLowerCase().includes(term) || this.customerName(o.customerId).toLowerCase().includes(term);
      const matchesStage = stages.size === 0 || stages.has(o.stage);
      return matchesSearch && matchesStage;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.stageFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Opportunity[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Opportunity[]>();
    for (const row of rows) {
      const key = field === 'stage' ? this.stageLabel(row.stage) : row.salesRep;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStageFilter(value: OpportunityStage): void {
    this.stageFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.stageFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected stageLabel(stage: OpportunityStage): string {
    return OPPORTUNITY_STAGE_LABEL[stage];
  }

  protected stageTone(stage: OpportunityStage): Tone {
    return OPPORTUNITY_STAGE_TONE[stage];
  }

  protected customerName(customerId: string): string {
    return CUSTOMERS.find((c) => c.id === customerId)?.legalName ?? 'Cliente no encontrado';
  }

  protected openDetail(opportunity: Opportunity): void {
    this.router.navigate(['/apps/crm/opportunities', opportunity.id]);
  }
}
