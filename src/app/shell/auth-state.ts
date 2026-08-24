import { Injectable, computed, signal } from '@angular/core';
import { APP_USERS } from '@core/mock-data';
import { SessionUser } from '@core/models';

const STORAGE_KEY = 'ccp-erp-session';

/** Mock, frontend-only session — validates against the hardcoded pilot users and persists the (password-free) session to localStorage. No backend, no token, no real security. */
@Injectable({ providedIn: 'root' })
export class AuthState {
  readonly currentUser = signal<SessionUser | null>(this.restore());

  readonly isWarehouse = computed(() => this.currentUser()?.role === 'warehouse');
  readonly isPurchasing = computed(() => this.currentUser()?.role === 'purchasing');

  login(email: string, password: string): boolean {
    const match = APP_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
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
