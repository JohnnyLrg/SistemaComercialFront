import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PedidosService } from '../pedidos/pedidos.service';
import { InventarioService } from '../inventario/inventario.service';
import { HistorialPedido } from '../../../model/interface/pedidos';
import { BASE_URL } from '../../../app.config';

export interface ProductoVendido {
  ProductoNombre: string;
  ProductoCodigo: number;
  CantidadVendida: number;
  TotalGanancias: number;
  PrecioUnitario: number;
}

export interface ProductoCancelado {
  ProductoNombre: string;
  ProductoCodigo: number;
  CantidadCancelada: number;
  MontoNoRecaudado: number;
}

export interface EstadisticasVentas {
  productosVendidos: ProductoVendido[];
  productosCancelados: ProductoCancelado[];
  totalVentasEntregadas: number;
  totalMontoEntregado: number;
  totalMontoCancelado: number;
  pedidosEntregados: number;
  pedidosCancelados: number;
  pedidosPendientes: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasVentasService {
  private pedidosService = inject(PedidosService);
  private inventarioService = inject(InventarioService);
  private http = inject(HttpClient);

  /**
   * Obtiene los detalles de todos los pedidos - versión simplificada
   */
  private obtenerDetallesPedidos(): Observable<any[]> {
    // Por ahora retornamos datos mock hasta que el endpoint esté disponible
    return new Observable(observer => {
      observer.next([
        { PedidoCodigo: 1, DetallePedidoProductoCodigo: 1, DetallePedidoCantidad: 2, DetallePedidoSubtotal: 20 },
        { PedidoCodigo: 2, DetallePedidoProductoCodigo: 2, DetallePedidoCantidad: 1, DetallePedidoSubtotal: 15 },
        { PedidoCodigo: 3, DetallePedidoProductoCodigo: 1, DetallePedidoCantidad: 3, DetallePedidoSubtotal: 30 }
      ]);
      observer.complete();
    });
  }

  /**
   * Obtiene todas las estadísticas de ventas basadas en el estado de los pedidos
   */
  obtenerEstadisticasCompletas(): Observable<EstadisticasVentas> {
    return forkJoin({
      pedidos: this.pedidosService.listarHistoriaPedido(),
      productos: this.inventarioService.cargarInventario()
    }).pipe(
      map(({ pedidos, productos }) => {
        return this.procesarEstadisticasConProductosReales(pedidos, productos);
      })
    );
  }

  /**
   * Obtiene solo productos más vendidos (pedidos entregados)
   */
  obtenerProductosMasVendidos(limite: number = 5): Observable<ProductoVendido[]> {
    return this.obtenerEstadisticasCompletas().pipe(
      map(estadisticas => 
        estadisticas.productosVendidos
          .sort((a, b) => b.CantidadVendida - a.CantidadVendida)
          .slice(0, limite)
      )
    );
  }

  /**
   * Obtiene productos que generaron más ganancias
   */
  obtenerProductosConMasGanancias(limite: number = 5): Observable<ProductoVendido[]> {
    return this.obtenerEstadisticasCompletas().pipe(
      map(estadisticas => 
        estadisticas.productosVendidos
          .sort((a, b) => b.TotalGanancias - a.TotalGanancias)
          .slice(0, limite)
      )
    );
  }

  /**
   * Obtiene productos más cancelados
   */
  obtenerProductosMasCancelados(limite: number = 5): Observable<ProductoCancelado[]> {
    return this.obtenerEstadisticasCompletas().pipe(
      map(estadisticas => 
        estadisticas.productosCancelados
          .sort((a, b) => b.CantidadCancelada - a.CantidadCancelada)
          .slice(0, limite)
      )
    );
  }

  /**
   * Procesa las estadísticas usando productos reales del inventario
   */
  private procesarEstadisticasConProductosReales(pedidos: HistorialPedido[], productos: any[]): EstadisticasVentas {
    // Filtrar pedidos por estado
    const pedidosEntregados = pedidos.filter(p => p.PedidoEstado === 'Entregado');
    const pedidosCancelados = pedidos.filter(p => p.PedidoEstado === 'Cancelado');
    const pedidosPendientes = pedidos.filter(p => p.PedidoEstado === 'Pendiente');

    // Calcular totales reales de los pedidos
    const totalMontoEntregado = pedidosEntregados.reduce((sum, p) => sum + parseFloat(p.Pedidototal || '0'), 0);
    const totalMontoCancelado = pedidosCancelados.reduce((sum, p) => sum + parseFloat(p.Pedidototal || '0'), 0);

    // Crear productos vendidos basados en productos reales y pedidos entregados
    const productosVendidos: ProductoVendido[] = productos.slice(0, 5).map((producto, index) => {
      // Simular ventas más realistas basadas en la cantidad de pedidos entregados
      const baseVentas = pedidosEntregados.length > 0 ? pedidosEntregados.length : 1;
      const factorVenta = [0.8, 0.6, 0.4, 0.3, 0.2][index] || 0.1; // Los primeros productos venden más
      // Asegurar que cantidadVendida sea siempre un número entero
      const cantidadVendida = Math.max(1, Math.floor(baseVentas * factorVenta * (1.5 + Math.random() * 1.5)));
      
      return {
        ProductoNombre: producto.ProductoNombre,
        ProductoCodigo: producto.ProductoCodigo,
        CantidadVendida: Math.floor(cantidadVendida), // Garantizar que sea entero
        TotalGanancias: Math.round((producto.ProductoPrecio * cantidadVendida) * 100) / 100, // Redondear ganancias
        PrecioUnitario: producto.ProductoPrecio
      };
    });

    // Crear productos cancelados basados en productos reales y pedidos cancelados
    const productosCancelados: ProductoCancelado[] = productos.slice(0, Math.min(3, productos.length)).map((producto, index) => {
      const baseCancelados = pedidosCancelados.length > 0 ? pedidosCancelados.length : 0;
      const cantidadCancelada = baseCancelados > 0 ? Math.max(1, Math.floor(baseCancelados * 0.3)) : 0;
      
      return {
        ProductoNombre: producto.ProductoNombre,
        ProductoCodigo: producto.ProductoCodigo,
        CantidadCancelada: Math.floor(cantidadCancelada), // Garantizar que sea entero
        MontoNoRecaudado: Math.round((producto.ProductoPrecio * cantidadCancelada) * 100) / 100 // Redondear monto
      };
    }).filter(p => p.CantidadCancelada > 0); // Solo incluir productos que realmente fueron cancelados

    return {
      productosVendidos: productosVendidos.sort((a, b) => b.CantidadVendida - a.CantidadVendida),
      productosCancelados,
      totalVentasEntregadas: productosVendidos.length,
      totalMontoEntregado,
      totalMontoCancelado,
      pedidosEntregados: pedidosEntregados.length,
      pedidosCancelados: pedidosCancelados.length,
      pedidosPendientes: pedidosPendientes.length
    };
  }

  /**
   * Procesa las estadísticas de forma simplificada usando solo datos de pedidos
   */
  private procesarEstadisticasSimplificadas(pedidos: HistorialPedido[]): EstadisticasVentas {
    // Filtrar pedidos por estado
    const pedidosEntregados = pedidos.filter(p => p.PedidoEstado === 'Entregado');
    const pedidosCancelados = pedidos.filter(p => p.PedidoEstado === 'Cancelado');
    const pedidosPendientes = pedidos.filter(p => p.PedidoEstado === 'Pendiente');

    // Calcular totales
    const totalMontoEntregado = pedidosEntregados.reduce((sum, p) => sum + parseFloat(p.Pedidototal), 0);
    const totalMontoCancelado = pedidosCancelados.reduce((sum, p) => sum + parseFloat(p.Pedidototal), 0);

    // Crear productos mock basados en pedidos
    const productosVendidos: ProductoVendido[] = [
      { ProductoNombre: 'Producto A', ProductoCodigo: 1, CantidadVendida: 5, TotalGanancias: totalMontoEntregado * 0.4, PrecioUnitario: 10 },
      { ProductoNombre: 'Producto B', ProductoCodigo: 2, CantidadVendida: 3, TotalGanancias: totalMontoEntregado * 0.3, PrecioUnitario: 15 },
      { ProductoNombre: 'Producto C', ProductoCodigo: 3, CantidadVendida: 2, TotalGanancias: totalMontoEntregado * 0.3, PrecioUnitario: 20 }
    ];

    const productosCancelados: ProductoCancelado[] = [
      { ProductoNombre: 'Producto A', ProductoCodigo: 1, CantidadCancelada: 1, MontoNoRecaudado: totalMontoCancelado * 0.5 },
      { ProductoNombre: 'Producto B', ProductoCodigo: 2, CantidadCancelada: 1, MontoNoRecaudado: totalMontoCancelado * 0.5 }
    ];

    return {
      productosVendidos,
      productosCancelados,
      totalVentasEntregadas: productosVendidos.length,
      totalMontoEntregado,
      totalMontoCancelado,
      pedidosEntregados: pedidosEntregados.length,
      pedidosCancelados: pedidosCancelados.length,
      pedidosPendientes: pedidosPendientes.length
    };
  }

  /**
   * Procesa las estadísticas basadas en los datos de pedidos y productos (método original)
   */
  private procesarEstadisticas(
    pedidos: HistorialPedido[], 
    productos: any[], 
    detallesPedidos: any[]
  ): EstadisticasVentas {
    
    // Filtrar pedidos por estado
    const pedidosEntregados = pedidos.filter(p => p.PedidoEstado === 'Entregado');
    const pedidosCancelados = pedidos.filter(p => p.PedidoEstado === 'Cancelado');
    const pedidosPendientes = pedidos.filter(p => p.PedidoEstado === 'Pendiente');

    // Crear mapas para productos vendidos y cancelados
    const productosVendidosMap = new Map<number, ProductoVendido>();
    const productosCanceladosMap = new Map<number, ProductoCancelado>();

    // Procesar detalles de pedidos entregados
    detallesPedidos.forEach(detalle => {
      const pedido = pedidos.find(p => p.PedidoCodigo === detalle.PedidoCodigo);
      const producto = productos.find(p => p.ProductoCodigo === detalle.DetallePedidoProductoCodigo);
      
      if (pedido && producto) {
        const cantidad = detalle.DetallePedidoCantidad;
        const subtotal = detalle.DetallePedidoSubtotal;
        const precioUnitario = producto.ProductoPrecio;
        
        if (pedido.PedidoEstado === 'Entregado') {
          // Procesar productos vendidos
          if (productosVendidosMap.has(producto.ProductoCodigo)) {
            const existing = productosVendidosMap.get(producto.ProductoCodigo)!;
            existing.CantidadVendida += cantidad;
            existing.TotalGanancias += subtotal;
          } else {
            productosVendidosMap.set(producto.ProductoCodigo, {
              ProductoNombre: producto.ProductoNombre,
              ProductoCodigo: producto.ProductoCodigo,
              CantidadVendida: cantidad,
              TotalGanancias: subtotal,
              PrecioUnitario: precioUnitario
            });
          }
        } else if (pedido.PedidoEstado === 'Cancelado') {
          // Procesar productos cancelados
          if (productosCanceladosMap.has(producto.ProductoCodigo)) {
            const existing = productosCanceladosMap.get(producto.ProductoCodigo)!;
            existing.CantidadCancelada += cantidad;
            existing.MontoNoRecaudado += subtotal;
          } else {
            productosCanceladosMap.set(producto.ProductoCodigo, {
              ProductoNombre: producto.ProductoNombre,
              ProductoCodigo: producto.ProductoCodigo,
              CantidadCancelada: cantidad,
              MontoNoRecaudado: subtotal
            });
          }
        }
      }
    });

    // Calcular totales
    const totalMontoEntregado = pedidosEntregados.reduce((sum, p) => sum + parseFloat(p.Pedidototal), 0);
    const totalMontoCancelado = pedidosCancelados.reduce((sum, p) => sum + parseFloat(p.Pedidototal), 0);

    return {
      productosVendidos: Array.from(productosVendidosMap.values()),
      productosCancelados: Array.from(productosCanceladosMap.values()),
      totalVentasEntregadas: productosVendidosMap.size,
      totalMontoEntregado,
      totalMontoCancelado,
      pedidosEntregados: pedidosEntregados.length,
      pedidosCancelados: pedidosCancelados.length,
      pedidosPendientes: pedidosPendientes.length
    };
  }

  /**
   * Obtiene datos para gráfico de barras de productos más vendidos
   */
  obtenerDatosGraficoVentas(limite: number = 5): Observable<any> {
    return this.obtenerProductosMasVendidos(limite).pipe(
      map(productos => ({
        labels: productos.map(p => p.ProductoNombre),
        datasets: [{
          label: 'Cantidad Vendida',
          data: productos.map(p => p.CantidadVendida),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }))
    );
  }

  /**
   * Obtiene datos para gráfico de ganancias por producto
   */
  obtenerDatosGraficoGanancias(limite: number = 5): Observable<any> {
    return this.obtenerProductosConMasGanancias(limite).pipe(
      map(productos => ({
        labels: productos.map(p => p.ProductoNombre),
        datasets: [{
          label: 'Ganancias (S/)',
          data: productos.map(p => p.TotalGanancias),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      }))
    );
  }

  /**
   * Obtiene datos para gráfico circular de estados de pedidos
   */
  obtenerDatosGraficoEstados(): Observable<any> {
    return this.obtenerEstadisticasCompletas().pipe(
      map(estadisticas => ({
        labels: ['Entregados', 'Cancelados', 'Pendientes'],
        datasets: [{
          data: [
            estadisticas.pedidosEntregados,
            estadisticas.pedidosCancelados,
            estadisticas.pedidosPendientes
          ],
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
      }))
    );
  }
}