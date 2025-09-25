import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardConfigService, DashboardConfig } from '../../../../controller/service/dashboard-config.service';

@Component({
  selector: 'app-dashboard-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard-config.component.html',
  styleUrl: './dashboard-config.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardConfigComponent {
  private fb = inject(FormBuilder);
  public dashboardConfigService = inject(DashboardConfigService);

  // Señales reactivas
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  imagePreview = signal<string | null>(null);

  // Configuración actual
  currentConfig = this.dashboardConfigService.getConfigSignal();

  // Formulario reactivo
  configForm: FormGroup;

  constructor() {
    this.configForm = this.fb.group({
      titulo: [this.currentConfig().titulo, [Validators.required, Validators.minLength(5)]],
      descripcion: [this.currentConfig().descripcion, [Validators.required, Validators.minLength(10)]],
      textBoton: [this.currentConfig().textBoton, [Validators.required, Validators.minLength(2)]],
      imagenPrincipal: [null]
    });

    // Actualizar el preview de la imagen actual
    this.imagePreview.set(this.currentConfig().imagenPrincipal);
  }

  /**
   * Maneja la selección de archivo de imagen
   */
  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.showError('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showError('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }

      // Mostrar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Actualizar el formulario
      this.configForm.patchValue({ imagenPrincipal: file });
    }
  }

  /**
   * Guarda la configuración del dashboard
   */
  async onSaveConfig(): Promise<void> {
    if (this.configForm.invalid) {
      this.showError('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    try {
      const formValue = this.configForm.value;
      
      // Actualizar texto primero
      this.dashboardConfigService.updateFullConfig({
        titulo: formValue.titulo,
        descripcion: formValue.descripcion,
        textBoton: formValue.textBoton
      });

      // Si hay una nueva imagen, subirla
      if (formValue.imagenPrincipal) {
        await this.dashboardConfigService.updateImagenPrincipal(formValue.imagenPrincipal);
      }

      this.showSuccess('Configuración del dashboard guardada exitosamente.');
      
      // Limpiar el campo de archivo
      this.configForm.patchValue({ imagenPrincipal: null });
      
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      this.showError('Error al guardar la configuración. Intenta nuevamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Restaura la configuración por defecto
   */
  onResetToDefault(): void {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto? Se perderán todos los cambios.')) {
      this.dashboardConfigService.resetToDefault();
      
      // Actualizar el formulario con los valores por defecto
      const defaultConfig = this.dashboardConfigService.getConfig();
      this.configForm.patchValue({
        titulo: defaultConfig.titulo,
        descripcion: defaultConfig.descripcion,
        textBoton: defaultConfig.textBoton,
        imagenPrincipal: null
      });
      
      this.imagePreview.set(defaultConfig.imagenPrincipal);
      this.showSuccess('Configuración restaurada por defecto.');
    }
  }

  /**
   * Restaura solo la imagen por defecto
   */
  onResetImage(): void {
    if (confirm('¿Quieres restaurar la imagen por defecto?')) {
      this.dashboardConfigService.resetImagenPrincipal();
      this.imagePreview.set(this.currentConfig().imagenPrincipal);
      this.configForm.patchValue({ imagenPrincipal: null });
      this.showSuccess('Imagen restaurada por defecto.');
    }
  }

  /**
   * Obtiene información del tamaño del almacenamiento
   */
  getStorageInfo(): string {
    return this.dashboardConfigService.getStorageSize();
  }

  /**
   * Muestra mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  /**
   * Muestra mensaje de error
   */
  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
  }

  /**
   * Limpia todos los mensajes
   */
  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  /**
   * Verifica si un campo tiene errores
   */
  hasError(field: string): boolean {
    const control = this.configForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(field: string): string {
    const control = this.configForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) return `${this.getFieldLabel(field)} es requerido.`;
      if (control.errors['minlength']) return `${this.getFieldLabel(field)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    }
    return '';
  }

  /**
   * Obtiene la etiqueta del campo
   */
  private getFieldLabel(field: string): string {
    const labels: {[key: string]: string} = {
      'titulo': 'El título',
      'descripcion': 'La descripción',
      'textBoton': 'El texto del botón'
    };
    return labels[field] || field;
  }
}