import { Injectable, computed, signal } from '@angular/core';
import { APP_USERS } from '@core/mock-data';
import { AppUser, SessionUser } from '@core/models';
import { TableStore } from '@core/supabase/table-store';

const STORAGE_KEY = 'ccp-erp-session';

/**
 * Mock, frontend-only session. Validates against the pilot users — the bundled fixture is the
 * always-available baseline, and any rows in the Supabase `users` table are layered on top (so the
 * user list is "persisted like everything else", and could later be edited from an admin screen).
 * No backend token, no real security.
 */
@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly store = new TableStore<AppUser>('users');
  private readonly users = signal<AppUser[]>([...APP_USERS]);

  readonly currentUser = signal<SessionUser | null>(this.restore());

  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  /** `admin` passes every one of these — the demo user can take any role-gated action. */
  readonly isWarehouse = computed(() => this.isAdmin() || this.currentUser()?.role === 'warehouse');
  readonly isPurchasing = computed(() => this.isAdmin() || this.currentUser()?.role === 'purchasing');
  readonly isSales = computed(() => this.isAdmin() || this.currentUser()?.role === 'sales');
  readonly isBilling = computed(() => this.isAdmin() || this.currentUser()?.role === 'billing');

  constructor() {
    this.store.fetchAll().then((rows) => {
      if (!rows?.length) return;
      const byId = new Map(this.users().map((u) => [u.id, u]));
      for (const row of rows) byId.set(row.id, row);
      this.users.set([...byId.values()]);
    });
  }

  login(email: string, password: string): boolean {
    const match = this.users().find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!match) return false;

    const { password: _password, ...session } = match;
    this.currentUser.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private restore(): SessionUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }
}
