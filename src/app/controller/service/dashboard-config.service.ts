import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DashboardConfig {
  titulo: string;
  descripcion: string;
  imagenPrincipal: string; // Base64 string o URL de la imagen
  imagenPrincipalOriginal: string; // Imagen por defecto
  textBoton: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardConfigService {
  private readonly STORAGE_KEY = 'dashboard_config';
  
  // Configuración por defecto
  private defaultConfig: DashboardConfig = {
    titulo: 'Sistema Comercial - Gestión integral de productos',
    descripcion: 'Descubre la calidad y variedad de nuestros productos comerciales. ¡Bienvenido a tu plataforma comercial!',
    imagenPrincipal: '../../../../assets/empresa.png',
    imagenPrincipalOriginal: '../../../../assets/empresa.png',
    textBoton: 'Conocer Más'
  };

  // Signal reactivo para la configuración
  private configSignal = signal<DashboardConfig>(this.getConfig());
  
  // BehaviorSubject para compatibilidad con observables
  private configSubject = new BehaviorSubject<DashboardConfig>(this.getConfig());

  constructor() {
    // Inicializar con la configuración guardada o la por defecto
    const savedConfig = this.getConfig();
    this.configSignal.set(savedConfig);
    this.configSubject.next(savedConfig);
  }

  /**
   * Obtiene la configuración actual como signal (reactivo)
   */
  getConfigSignal(): import('@angular/core').Signal<DashboardConfig> {
    return this.configSignal.asReadonly();
  }

  /**
   * Obtiene la configuración actual como observable
   */
  getConfig$(): Observable<DashboardConfig> {
    return this.configSubject.asObservable();
  }

  /**
   * Obtiene la configuración actual de forma síncrona
   */
  getConfig(): DashboardConfig {
    try {
      const savedConfig = localStorage.getItem(this.STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        return { ...this.defaultConfig, ...parsed };
      }
    } catch (error) {
      console.error('Error al cargar configuración del dashboard:', error);
    }
    return { ...this.defaultConfig };
  }

  /**
   * Actualiza el título del dashboard
   */
  updateTitulo(titulo: string): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, titulo };
    this.saveConfig(newConfig);
  }

  /**
   * Actualiza la descripción del dashboard
   */
  updateDescripcion(descripcion: string): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, descripcion };
    this.saveConfig(newConfig);
  }

  /**
   * Actualiza el texto del botón
   */
  updateTextBoton(textBoton: string): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, textBoton };
    this.saveConfig(newConfig);
  }

  /**
   * Actualiza la imagen principal del dashboard
   */
  updateImagenPrincipal(imageFile: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const base64String = e.target?.result as string;
          const currentConfig = this.getConfig();
          
          const newConfig = { ...currentConfig, imagenPrincipal: base64String };
          this.saveConfig(newConfig);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Actualiza toda la configuración del dashboard
   */
  updateFullConfig(config: Partial<DashboardConfig>): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, ...config };
    this.saveConfig(newConfig);
  }

  /**
   * Restaura la configuración por defecto
   */
  resetToDefault(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    const defaultConfig = { ...this.defaultConfig };
    this.configSignal.set(defaultConfig);
    this.configSubject.next(defaultConfig);
  }

  /**
   * Restaura solo la imagen por defecto
   */
  resetImagenPrincipal(): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, imagenPrincipal: currentConfig.imagenPrincipalOriginal };
    this.saveConfig(newConfig);
  }

  /**
   * Guarda la configuración en localStorage
   */
  private saveConfig(config: DashboardConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      this.configSignal.set(config);
      this.configSubject.next(config);
    } catch (error) {
      console.error('Error al guardar configuración del dashboard:', error);
      throw new Error('No se pudo guardar la configuración del dashboard');
    }
  }

  /**
   * Verifica si hay una configuración personalizada
   */
  hasCustomConfig(): boolean {
    const config = this.getConfig();
    return config.titulo !== this.defaultConfig.titulo || 
           config.descripcion !== this.defaultConfig.descripcion ||
           config.imagenPrincipal !== this.defaultConfig.imagenPrincipal ||
           config.textBoton !== this.defaultConfig.textBoton;
  }

  /**
   * Obtiene el tamaño aproximado de los datos guardados en localStorage
   */
  getStorageSize(): string {
    try {
      const config = localStorage.getItem(this.STORAGE_KEY);
      if (config) {
        const sizeInBytes = new Blob([config]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        return `${sizeInKB} KB`;
      }
    } catch (error) {
      console.error('Error al calcular tamaño:', error);
    }
    return '0 KB';
  }
}