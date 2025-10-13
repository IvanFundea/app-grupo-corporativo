import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LucideAngularModule, icons } from 'lucide-angular';
import { importProvidersFrom } from '@angular/core';

const enhancedAppConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(LucideAngularModule.pick(icons)), // ✅ Registro global
  ],
};

bootstrapApplication(App, enhancedAppConfig)
  .catch((err) => console.error(err));