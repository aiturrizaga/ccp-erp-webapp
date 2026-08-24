import { UserRole } from '@core/models';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  /** Restricts this item to the given roles. Omit to show it to every role. */
  roles?: UserRole[];
}
