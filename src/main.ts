import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LucideAngularModule, icons } from 'lucide-angular';
import { importProvidersFrom } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';

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
    })) // ✅ Configuración de ngx-toastr
  ],
};

bootstrapApplication(App, enhancedAppConfig)
  .catch((err) => console.error(err));