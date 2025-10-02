export interface Inventario {
  ProductoCodigo: number;
  ProductoNombre: string;
  ProductoDescripcion: string;
  ProductoPrecio: number;
  ProductoCantidad: number;
  ProductoFoto: string;
  ProductoEstado: string; // 'V' para Vigente, 'D' para Descontinuado
  Categoria: string;
  CategoriaNombre: string; // Nombre de la categoría que viene del backend
  Producto_TipoProductoCodigo: number;
}export interface InventoryHistory {
  HistorialId: number;
  ProductoCodigo: number;
  ProductoNombre?: string; // Opcional, puede venir del join con la tabla Productos
  CampoModificado: string;
  ValorAnterior: string;
  ValorNuevo: string;
  FechaCambio: string;
  TipoCambio: string; // 'Creacion' o 'Actualizacion'
  EmpleadoCodigo?: number; // Puede ser NULL
  EmpleadoNombre?: string; // Opcional, puede venir del join con la tabla Empleado
}

export interface Categoria {
  TipoProductoCodigo: number;
  TipoProductoNombre: string;
}
