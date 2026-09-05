/** The areas piloting this prototype — each sees a different slice of the ERP. `admin` sees and can do everything, for end-to-end demos. */
export type UserRole = 'warehouse' | 'purchasing' | 'sales' | 'billing' | 'admin';

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  warehouse: 'Almacén',
  purchasing: 'Logística',
  sales: 'Ventas',
  billing: 'Finanzas',
  admin: 'Administrador',
};

/** Mock credential record — plain-text password is fine here, this login never talks to a real backend. */
export interface AppUser {
  /** Stable id so the row can live in Supabase like every other entity. */
  id: string;
  email: string;
  password: string;
  name: string;
  area: string;
  role: UserRole;
}

/** What actually gets persisted/held in session — never the password. */
export type SessionUser = Omit<AppUser, 'password'>;
