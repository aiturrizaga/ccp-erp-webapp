export type ListViewType = 'list' | 'grid' | 'kanban';

export interface ListViewOption {
  value: ListViewType;
  label: string;
  icon: string;
}

export const LIST_VIEW_OPTIONS: Record<ListViewType, ListViewOption> = {
  list: { value: 'list', label: 'Lista', icon: 'tablerLayoutList' },
  grid: { value: 'grid', label: 'Cuadrícula', icon: 'tablerLayoutGrid' },
  kanban: { value: 'kanban', label: 'Kanban', icon: 'tablerLayoutKanban' },
};
