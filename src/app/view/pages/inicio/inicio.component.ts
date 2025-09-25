import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardConfigService, DashboardConfig } from '../../../controller/service/dashboard-config.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InicioComponent {
  private dashboardConfigService = inject(DashboardConfigService);
  
  // Configuración reactiva del dashboard
  dashboardConfig = this.dashboardConfigService.getConfigSignal();
}
