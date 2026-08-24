import { Currency } from './shared.model';

/** Master data owned by the Purchasing app (Section 34 of the master context: business partner, not its own App). */
export type SupplierStatus = 'draft' | 'under_evaluation' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';

export const SUPPLIER_STATUS_LABEL: Record<SupplierStatus, string> = {
  draft: 'Borrador',
  under_evaluation: 'En evaluación',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  suspended: 'Suspendido',
};

export type SupplierClass = 'PRODUCT' | 'SERVICE';
export type SupplierTier = 'A' | 'B' | 'C';

export interface SupplierPerformance {
  onTimeDeliveryPct: number;
  completedOrdersPct: number;
  qualityRating: number; // 1-5
}

export interface Supplier {
  id: string;
  taxId: string;
  legalName: string;
  class: SupplierClass;
  tier: SupplierTier;
  businessLine: string | null;
  address: string;
  phone: string;
  email: string;
  currency: Currency;
  paymentTerms: string;
  bankAccount: string;
  status: SupplierStatus;
  createdBy: string;
  registeredAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  creditLimit: number;
  creditUsed: number;
  performance: SupplierPerformance;
}
