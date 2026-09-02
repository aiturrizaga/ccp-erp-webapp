import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@core/models';
import { AuthState } from './auth-state';

/** Blocks direct URL access to routes reserved for specific roles (e.g. Logística-only screens). */
export function roleGuard(allowed: UserRole[]): CanActivateFn {
  return () => {
    const role = inject(AuthState).currentUser()?.role;
    if (role && allowed.includes(role)) return true;

    inject(Router).navigate(['/apps/purchasing/replenishment-suggestions']);
    return false;
  };
}
