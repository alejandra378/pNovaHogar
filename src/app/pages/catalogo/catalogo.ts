import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropiedadesService, Propiedad } from '../../services/propiedades';

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  propiedades: Propiedad[] = [];
  filtroActivo = 'Todos';
  cargando = true;
  error = '';

  filtros = [
    { valor: 'Todos', etiqueta: 'Todos', icono: '🏠' },
    { valor: 'Casa', etiqueta: 'Casas', icono: '🏡' },
    { valor: 'Departamento', etiqueta: 'Departamentos', icono: '🏢' },
    { valor: 'Terreno', etiqueta: 'Terrenos', icono: '🌳' },
    { valor: 'Local', etiqueta: 'Locales', icono: '🏬' },
  ];

  private isBrowser: boolean;

  constructor(
    private propiedadesService: PropiedadesService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // La petición HTTP solo se hace en el navegador: durante el
    // renderizado en servidor (SSR) la ruta relativa /api/... no
    // tiene un host al cual apuntar y se queda esperando.
    this.cargar();

  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.propiedadesService.listar(this.filtroActivo).subscribe({
      next: (data) => {
        console.log('PROPIEDADES RECIBIDAS:', data);
        this.propiedades = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR PROPIEDADES:', err);
        this.error = 'No se pudo conectar con el servicio de propiedades. Verifica que la API esté corriendo (npm run api).';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  cambiarFiltro(valor: string): void {
    if (this.filtroActivo === valor) return;
    this.filtroActivo = valor;
    this.cargar();
  }

  verDetalle(id: number): void {
    this.router.navigate(['/detalle-propiedad', id]);
  }

  formatearPrecio(precio: number): string {
    return precio.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  }
}