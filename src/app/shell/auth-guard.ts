import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from './auth-state';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthState);
  if (auth.currentUser()) return true;

  inject(Router).navigate(['/login']);
  return false;
};
