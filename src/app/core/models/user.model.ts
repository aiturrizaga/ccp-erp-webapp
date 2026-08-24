/** The two areas piloting this prototype — each sees a different slice of Compras. */
export type UserRole = 'warehouse' | 'purchasing';

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  warehouse: 'Almacén',
  purchasing: 'Logística',
};

/** Mock credential record — plain-text password is fine here, this login never talks to a real backend. */
export interface AppUser {
  email: string;
  password: string;
  name: string;
  area: string;
  role: UserRole;
}

/** What actually gets persisted/held in session — never the password. */
export type SessionUser = Omit<AppUser, 'password'>;
