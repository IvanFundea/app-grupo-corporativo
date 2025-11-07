import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

// Pipe para formatear fechas/horas forzando una zona horaria (por defecto GMT-6)
@Pipe({
  name: 'tzDate',
  standalone: true,
})
export class TimezoneDatePipe implements PipeTransform {
  private locale = inject(LOCALE_ID);
  private datePipe = new DatePipe(this.locale);

  transform(value: any, format: string = 'medium', timezone: string = '-0600', locale?: string): string | null {
    // Usa el locale global por defecto; permite override opcional
    const loc = locale || this.locale;
    // DatePipe acepta timezone como 'UTC', '-0600', 'GMT-06:00' o zoned IDs como 'America/Guatemala'
    return this.datePipe.transform(value, format, timezone, loc);
  }
}
