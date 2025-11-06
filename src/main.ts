import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LucideAngularModule, icons } from 'lucide-angular';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Registrar datos de localización en español para pipes de fecha/número, etc.
registerLocaleData(localeEs);

const enhancedAppConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(LucideAngularModule.pick(icons)), // ✅ Registro global de Lucide
    importProvidersFrom(ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true
    })), // ✅ Configuración de ngx-toastr
    { provide: LOCALE_ID, useValue: 'es' }, // ✅ Usar español como localización por defecto
  ],
};

bootstrapApplication(App, enhancedAppConfig)
  .catch((err) => console.error(err));