import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es-PE';

import { routes } from './app.routes';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// export const BASE_URL = 'http://192.168.0.100:8080';
export const BASE_URL = 'http://localhost:8080';

// Configuración Firebase para EMPLEADOS/ADMINISTRADORES
export const employeeFirebaseConfig = {
  apiKey: "AIzaSyAfA8VgjgVF7wr-TgmXTloyUcqxo8EaJXw",
  authDomain: "calidadusuariosempleados.firebaseapp.com",
  projectId: "calidadusuariosempleados",
  storageBucket: "calidadusuariosempleados.firebasestorage.app",
  messagingSenderId: "151722857160",
  appId: "1:151722857160:web:a33bf76de3b343ed36cbfd"
};

// Registrar la localización de Perú
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-PE' },
    importProvidersFrom(HttpClientModule),
    // Firebase para empleados/administradores (configuración principal)
    provideFirebaseApp(() => initializeApp(employeeFirebaseConfig)),
    provideAuth(() => getAuth()), provideAnimationsAsync(),
  ],
};
