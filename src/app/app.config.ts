import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { routes } from './app.routes';
import { APP_ICONS } from '@shared/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideIcons(APP_ICONS),
    provideNativeDateAdapter(),
    provideBrnCalendarI18n({
      firstDayOfWeek: () => 1,
      formatHeader: (month, year) =>
        new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(
          new Date(year, month, 1),
        ),
      formatMonth: (month) =>
        new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date(2024, month, 1)),
      formatWeekdayName: (day) =>
        ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day],
      labelNext: () => 'Mes siguiente',
      labelPrevious: () => 'Mes anterior',
      labelWeekday: (day) =>
        ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day],
    }),
  ],
};
