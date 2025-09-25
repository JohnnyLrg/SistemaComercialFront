import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ClienteInfoService } from '../../../../controller/service/pedidos/clienteInfo.service';
import { ChartData, ChartOptions, ChartTypeRegistry, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Chart } from 'chart.js';
import { DashboardService } from '../../../../controller/service/informes/dashboard.service';
import { Empleados } from '../../../../model/interface/empleados';
import { EmpleadosService } from '../../../../controller/service/autenticacionController/empleados.service';
import { RouterModule } from '@angular/router';
import { EstadisticasVentasService, ProductoVendido, EstadisticasVentas } from '../../../../controller/service/estadisticas/estadisticas-ventas.service';

Chart.register(...registerables);
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InicioComponent implements OnInit {
  // Datos para estadísticas
  estadisticasGenerales: EstadisticasVentas | null = null;
  productosMasVendidos: ProductoVendido[] = [];
  productosConMasGanancias: ProductoVendido[] = [];
  ultimosEmpleados: Empleados[] = [];

  // Datos para gráficos
  ventasData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Cantidad Vendida',
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  gananciasData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ganancias (S/)',
      backgroundColor: 'rgba(75, 192, 192, 0.8)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  estadosData: ChartData<'doughnut'> = {
    labels: ['Entregados', 'Cancelados', 'Pendientes'],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 205, 86, 0.8)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 205, 86, 1)'
      ],
      borderWidth: 1
    }]
  };

  ventasOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: 'category' },
      y: { beginAtZero: true }
    }
  };

  estadosOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false
  };

  // Servicios
  private clienteInfoService = inject(ClienteInfoService);
  private dashboardService = inject(DashboardService);
  private empleadosService = inject(EmpleadosService);
  private estadisticasService = inject(EstadisticasVentasService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarEstadisticasGenerales();
    this.cargarGraficos();
    this.cargarUltimosEmpleados();
  }

  /**
   * Carga las estadísticas generales del sistema
   */
  cargarEstadisticasGenerales(): void {
    this.estadisticasService.obtenerEstadisticasCompletas().subscribe({
      next: (estadisticas) => {
        this.estadisticasGenerales = estadisticas;
        this.productosMasVendidos = estadisticas.productosVendidos
          .sort((a, b) => b.CantidadVendida - a.CantidadVendida)
          .slice(0, 5);
        this.productosConMasGanancias = estadisticas.productosVendidos
          .sort((a, b) => b.TotalGanancias - a.TotalGanancias)
          .slice(0, 5);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        // En caso de error, usar datos mock para evitar pantalla vacía
        this.usarDatosMock();
      }
    });
  }

  /**
   * Carga los datos para los gráficos
   */
  cargarGraficos(): void {
    // Gráfico de productos más vendidos
    this.estadisticasService.obtenerDatosGraficoVentas(5).subscribe({
      next: (data) => {
        this.ventasData = data;
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error al cargar gráfico de ventas:', error)
    });

    // Gráfico de ganancias
    this.estadisticasService.obtenerDatosGraficoGanancias(5).subscribe({
      next: (data) => {
        this.gananciasData = data;
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error al cargar gráfico de ganancias:', error)
    });

    // Gráfico de estados de pedidos
    this.estadisticasService.obtenerDatosGraficoEstados().subscribe({
      next: (data) => {
        this.estadosData = data;
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error al cargar gráfico de estados:', error)
    });
  }

  /**
   * Carga los últimos empleados registrados
   */
  cargarUltimosEmpleados(): void {
    this.empleadosService.mostrarEmpleados().subscribe({
      next: (data) => {
        this.ultimosEmpleados = data.slice(-5);
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error al cargar empleados:', error)
    });
  }

  /**
   * Usa datos mock en caso de error con el backend
   */
  private usarDatosMock(): void {
    this.productosMasVendidos = [
      { ProductoNombre: 'Producto 1', ProductoCodigo: 1, CantidadVendida: 10, TotalGanancias: 100, PrecioUnitario: 10 },
      { ProductoNombre: 'Producto 2', ProductoCodigo: 2, CantidadVendida: 8, TotalGanancias: 80, PrecioUnitario: 10 }
    ];
    
    this.estadisticasGenerales = {
      productosVendidos: this.productosMasVendidos,
      productosCancelados: [],
      totalVentasEntregadas: 2,
      totalMontoEntregado: 180,
      totalMontoCancelado: 0,
      pedidosEntregados: 5,
      pedidosCancelados: 1,
      pedidosPendientes: 3
    };
    
    this.cdr.markForCheck();
  }
}

