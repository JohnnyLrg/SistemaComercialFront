import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Categoria, Inventario } from '../../../../model/interface/inventario';
import { InventarioService } from '../../../../controller/service/inventario/inventario-fixed.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { tipoproducto } from '../../../../model/interface/Productos';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,MatSnackBarModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InventarioComponent implements OnInit {
  @ViewChild('productImageInput', { static: false }) productImageInput!: ElementRef;
  inventario$: Observable<Inventario[]>;
  productForm: FormGroup;
  categoriaForm: FormGroup;
  editProductForm: FormGroup;
  selectedProduct: Inventario | null = null;
  categorias: Categoria[] = [];
  currentImage: string | null = null;
  newImagePreview: string | null = null;
  selectedImageFile: File | null = null;

  productosFiltrados: Inventario[] = [];
  filterProperty: string = '';
  estadoActual: string = 'V'; // Estado actual del filtro: 'V' para Vigentes, 'D' para Agotados

  alertMessage: string | null = null;
  constructor(
    private cdr : ChangeDetectorRef,
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private renderer: Renderer2,
    private snackBar: MatSnackBar,


  ) {
    this.productForm = this.fb.group({
      ProductoNombre: ['', [Validators.required, Validators.minLength(3)]],
      ProductoDescripcion: ['', [Validators.required,Validators.maxLength(100) ]],
      ProductoPrecio:[0, [Validators.required, Validators.min(1)]],
      ProductoCantidad: [0, [Validators.required, Validators.min(1)]],
      Producto_TipoProductoCodigo: [0, Validators.required],
      image: [null, Validators.required],
    });
    this.categoriaForm = this.fb.group({
      TipoProductoNombre: ['', [Validators.required, Validators.minLength(3)]],
      TipoProductoDescripcion: ['', [Validators.required,Validators.maxLength(100) ]],
    });


    this.editProductForm = this.fb.group({
      ProductoNombre: ['', [Validators.required, Validators.minLength(3)]],
      ProductoDescripcion: ['', Validators.required],
      ProductoPrecio: [0, [Validators.required, Validators.min(1)]],
      ProductoCantidad: [1, [Validators.required, Validators.min(1)]], // Mínimo 1, no permite 0
      Producto_TipoProductoCodigo: [0, Validators.required],
      ProductoFoto: [null],
    });
    this.inventario$ = this.inventarioService.obtenerInventario();
  }

  ngOnInit(): void {
    this.cargarProductosPorEstado('V'); // Cargar productos vigentes por defecto
    this.cargarCategorias();
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.currentImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    this.productForm.patchValue({
      image: file,
    });
  }

  onEditFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Por favor selecciona un archivo de imagen válido', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      // Validar tamaño de archivo (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('La imagen es muy grande. Máximo 5MB permitido.', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.newImagePreview = reader.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  cargarCategorias(): void {
    this.inventarioService.obtenerCategorias().subscribe(
      (data) => {
        this.categorias = data;
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error al cargar categorías:', error);
      }
    );
  }

  // NUEVO: Método para cargar productos por estado
  cargarProductosPorEstado(estado: string): void {
    this.estadoActual = estado;
    
    // Usar directamente el endpoint de inventario admin
    this.inventarioService.cargarInventarioAdmin(estado).subscribe((inventario) => {
      this.productosFiltrados = inventario;
      this.cdr.markForCheck();
    }, (error) => {
      console.error('Error al cargar productos por estado:', error);
    });
  }

  // NUEVO: Método para cambiar entre estados
  cambiarEstado(estado: string): void {
    this.cargarProductosPorEstado(estado);
    this.filterProperty = ''; // Limpiar filtro de búsqueda
  }

  trackByFn(index: number, item: Inventario) {
    return item.ProductoCodigo;
  }

  resetFileInput(): void {
    if (this.productImageInput) {
      this.renderer.setProperty(this.productImageInput.nativeElement, 'value', '');
    }
    this.currentImage = null;
  }

  ok(): void{
    this.snackBar.open('Por favor complete todos los campos requeridos correctamente.', 'Cerrar', {
      duration: 3000,

    });
  }
  agregarNuevaCategoria(): void {
    if (this.categoriaForm.invalid){
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end' // 'start', 'center', 'end', 'left', 'right'
      });
      return;
    }
    const nuevaCategoria: tipoproducto = {
      TipoProductoNombre: this.categoriaForm.get('TipoProductoNombre')?.value,
      TipoProductoDescripcion: this.categoriaForm.get('TipoProductoDescripcion')?.value,
    };
    this.inventarioService.agregartipoProducto(nuevaCategoria).subscribe({
      next: (response) => {
        console.log('Categoría agregada:', response);
        this.snackBar.open('Categoría agregada con éxito', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end'
        });
        // Actualizar la lista de categorías
        this.cargarCategorias();
        this.cdr.markForCheck();
        this.categoriaForm.reset();
      },
      error: (error) => {
        console.error('Error al agregar la categoría:', error);
        this.snackBar.open('Error al agregar la categoría', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end'
        });
      }
    });
  }

  onSubmit(): void {
    // Validar que la cantidad no sea 0
    const cantidad = this.productForm.get('ProductoCantidad')?.value;
    if (cantidad === 0 || cantidad === '0') {
      this.snackBar.open('No se puede colocar valores 0', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.productForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end' // 'start', 'center', 'end', 'left', 'right'
      });
      return;
    }

    const formData = new FormData();
    Object.keys(this.productForm.controls).forEach((key) => {
      formData.append(key, this.productForm.get(key)?.value);
    });

    this.inventarioService.agregarProducto(formData).subscribe(
      (response) => {
        console.log('Producto agregado:', response);
        this.cargarProductosPorEstado(this.estadoActual); // Recargar productos del estado actual
        this.productForm.reset();
        this.resetFileInput();
        alert('Producto agregado')

      },
      (error) => {
        console.error('Error al agregar producto:', error);
      }
    );
  }

  onEditSubmit(): void {
    if (this.selectedProduct && this.editProductForm.valid) {
      // Validar que la cantidad no sea 0
      const cantidad = this.editProductForm.get('ProductoCantidad')?.value;
      if (cantidad === 0 || cantidad === '0') {
        this.snackBar.open('No se puede colocar valores 0', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          panelClass: ['error-snackbar']
        });
        return;
      }

      const formData = new FormData();
      
      // Agregar todos los campos del formulario al FormData
      formData.append('ProductoNombre', this.editProductForm.get('ProductoNombre')?.value);
      formData.append('ProductoDescripcion', this.editProductForm.get('ProductoDescripcion')?.value);
      formData.append('ProductoPrecio', this.editProductForm.get('ProductoPrecio')?.value);
      formData.append('ProductoCantidad', cantidad.toString());
      console.log(`📦 Producto editado con cantidad = ${cantidad}`);
      
      formData.append('Producto_TipoProductoCodigo', this.editProductForm.get('Producto_TipoProductoCodigo')?.value);
      
      // Solo agregar imagen si se seleccionó una nueva
      if (this.selectedImageFile) {
        formData.append('image', this.selectedImageFile);
      }
      
      // Llamar al servicio con el ProductoCodigo y FormData
      this.inventarioService
        .modificarInventario(this.selectedProduct.ProductoCodigo, formData)
        .subscribe(
          (response) => {
            console.log('Producto actualizado:', response);
            this.cargarProductosPorEstado(this.estadoActual); // Recargar productos del estado actual
            // Limpiar vista previa y archivo seleccionado
            this.newImagePreview = null;
            this.selectedImageFile = null;
            this.snackBar.open('¡El producto se actualizó correctamente!', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end'
            });
            document.getElementById('editModal')?.click();
          },
          (error) => {
            console.error('Error al actualizar el producto:', error);
            this.snackBar.open('Ha ocurrido un error al actualizar el producto!', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end'
            });
          }
        );
    } else {
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end'
      });
    }
  }

  editItem(item: Inventario): void {
    this.selectedProduct = item;
    this.currentImage = item.ProductoFoto;
    this.newImagePreview = null; // Limpiar vista previa anterior
    this.selectedImageFile = null; // Limpiar archivo seleccionado anterior
    this.setEditFormValues(item);
    document.getElementById('editModal')?.click();
  }

  setEditFormValues(item: Inventario): void {
    this.editProductForm.patchValue({
      ProductoNombre: item.ProductoNombre,
      ProductoDescripcion: item.ProductoDescripcion,
      ProductoPrecio: item.ProductoPrecio,
      ProductoCantidad: item.ProductoCantidad,
      Producto_TipoProductoCodigo: this.getCategoriaCodigo(item.CategoriaNombre),
      ProductoFoto: null, // No establecer la foto aquí para evitar sobreescribirla
    });
  }
  getCategoriaCodigo(categoriaNombre: string): number {
    const categoria = this.categorias.find(
      (cat) => cat.TipoProductoNombre === categoriaNombre
    );
    return categoria ? categoria.TipoProductoCodigo : 0;
  }

  filtrarProductos(): void {
    if (!this.filterProperty.trim()) {
      // Si no hay filtro de búsqueda, cargar todos los productos del estado actual
      this.cargarProductosPorEstado(this.estadoActual);
    } else {
      // Filtrar por nombre dentro del estado actual
      this.inventarioService.cargarInventarioAdmin(this.estadoActual).subscribe((inventario) => {
        this.productosFiltrados = inventario.filter((producto) =>
          producto.ProductoNombre.toLowerCase().includes(
            this.filterProperty.toLowerCase()
          )
        );
        this.cdr.markForCheck();
      });
    }
  }
}
