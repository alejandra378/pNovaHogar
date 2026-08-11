import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropiedadesService, Propiedad } from '../../services/propiedades';

@Component({
  selector: 'app-detalle-propiedad',
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-propiedad.html',
  styleUrl: './detalle-propiedad.css',
})
export class DetallePropiedad implements OnInit, OnDestroy {
  propiedad: Propiedad | null = null;
  cargando = true;
  error = '';
  imagenActual = 0;

  private mapa: any = null;
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private propiedadesService: PropiedadesService,
     private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Igual que en el catálogo: solo pedimos los datos en el
    // navegador, para que no se quede esperando durante SSR.
    if (!this.isBrowser) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.propiedadesService.obtenerPorId(id).subscribe({
      next: (data) => {
        console.log('PROPIEDAD RECIBIDA:', data);
        this.propiedad = data;
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => this.inicializarMapa(), 0);
      },
      error: (err) => {
        console.error('ERROR DETALLE:', err);
        this.error = 'No se encontró la propiedad o el servicio no está disponible.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.mapa) this.mapa.remove();
  }

  private async inicializarMapa(): Promise<void> {
    if (!this.propiedad || !this.isBrowser) return;

    const L = await import('leaflet');
    const contenedor = document.getElementById('mapa-propiedad');
    if (!contenedor) return;

    this.mapa = L.map(contenedor).setView([this.propiedad.lat, this.propiedad.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; colaboradores de OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.mapa);

    const icono = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    L.marker([this.propiedad.lat, this.propiedad.lng], { icon: icono })
      .addTo(this.mapa)
      .bindPopup(this.propiedad.ubicacion)
      .openPopup();
  }

  imagenAnterior(): void {
    if (!this.propiedad) return;
    const total = this.propiedad.imagenes.length;
    this.imagenActual = (this.imagenActual - 1 + total) % total;
  }

  imagenSiguiente(): void {
    if (!this.propiedad) return;
    const total = this.propiedad.imagenes.length;
    this.imagenActual = (this.imagenActual + 1) % total;
  }

  irAImagen(i: number): void {
    this.imagenActual = i;
  }

  formatearPrecio(precio: number): string {
    return precio.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  }
}