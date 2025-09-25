import { Injectable, inject } from '@angular/core';
import {
  HistorialPedido,
  PedidoRequest,
} from '../../../model/interface/pedidos';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private http = inject(HttpClient);
  constructor() {}

  crearPedido(pedido: PedidoRequest): Observable<any> {
    return this.http.post(`${BASE_URL}/pedido/crearPedido`, pedido);
  }

  listarHistoriaPedido(): Observable<HistorialPedido[]> {
    return this.http.get<HistorialPedido[]>(
      `${BASE_URL}/pedido/historiaPedido`
    );
  }

  actualizarPedido(pedidoCodigo: number, estado: string): Observable<any> {
    const body = { PedidoCodigo: pedidoCodigo, PedidoEstado: estado };
    return this.http.put(`${BASE_URL}/pedido/actualizarEstadoPedido`, body);
  }

  obtenerFormasPago(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/formas-pago/listar`);
  }

  // Método para obtener todos los detalles de pedidos (necesario para estadísticas)
  obtenerTodosLosDetalles(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/pedido/detallesPedidos`);
  }
}
