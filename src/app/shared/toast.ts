import { signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  description?: string;
}

interface ToastOptions {
  description?: string;
}

const DURATION_MS = 4500;

let nextId = 1;

/** Global toast queue — a plain signal, not an Angular service, so `toast.success(...)` can be called from anywhere without DI. */
export const toastQueue = signal<ToastItem[]>([]);

export function dismissToast(id: number): void {
  toastQueue.update((items) => items.filter((t) => t.id !== id));
}

function push(variant: ToastVariant, message: string, options?: ToastOptions): void {
  const id = nextId++;
  toastQueue.update((items) => [...items, { id, variant, message, description: options?.description }]);
  setTimeout(() => dismissToast(id), DURATION_MS);
}

/** Drop-in toast API: `toast.success('Saved')`, `toast.error('Failed', { description: '...' })`. */
export const toast = {
  success: (message: string, options?: ToastOptions) => push('success', message, options),
  error: (message: string, options?: ToastOptions) => push('error', message, options),
  warning: (message: string, options?: ToastOptions) => push('warning', message, options),
  info: (message: string, options?: ToastOptions) => push('info', message, options),
};
