import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { AuthState } from '../auth-state';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports],
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthState);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal(false);

  protected submit(): void {
    const ok = this.auth.login(this.email(), this.password());
    if (!ok) {
      this.error.set(true);
      return;
    }
    this.error.set(false);
    this.router.navigate(['/']);
  }
}
