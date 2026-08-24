import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { ToastVariant, dismissToast, toastQueue } from '../../toast';

const ICON: Record<ToastVariant, string> = {
  success: 'tablerCircleCheck',
  error: 'tablerAlertOctagon',
  warning: 'tablerAlertTriangle',
  info: 'tablerInfoCircle',
};

const CLASSES: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
};

const ICON_CLASSES: Record<ToastVariant, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
};

/** Global toast rack, mounted once at the app root — reads the `toastQueue` signal pushed to by `toast.success/error/warning/info(...)`. */
@Component({
  selector: 'app-toast-container',
  imports: [NgIcon],
  template: `
    <div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      @for (item of toasts(); track item.id) {
        <div class="pointer-events-auto flex items-start gap-2 rounded-lg border p-3 text-sm shadow-lg" [class]="classesFor(item.variant)">
          <ng-icon [name]="iconFor(item.variant)" [class]="'mt-0.5 shrink-0 text-base ' + iconClassFor(item.variant)" />
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ item.message }}</p>
            @if (item.description) {
              <p class="mt-0.5 text-xs opacity-80">{{ item.description }}</p>
            }
          </div>
          <button type="button" class="shrink-0 opacity-60 hover:opacity-100" (click)="close(item.id)" aria-label="Cerrar">
            <ng-icon name="tablerX" class="text-sm" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly toasts = toastQueue;

  protected close(id: number): void {
    dismissToast(id);
  }

  protected classesFor(variant: ToastVariant): string {
    return CLASSES[variant];
  }

  protected iconFor(variant: ToastVariant): string {
    return ICON[variant];
  }

  protected iconClassFor(variant: ToastVariant): string {
    return ICON_CLASSES[variant];
  }
}
