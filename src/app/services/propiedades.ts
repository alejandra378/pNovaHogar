import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoPropiedad = 'Casa' | 'Departamento' | 'Terreno' | 'Local';
export type ServicioPropiedad = 'En venta' | 'En renta';

export interface Propiedad {
  id: number;
  titulo: string;
  tipo: TipoPropiedad;
  servicio: ServicioPropiedad;
  precio: number;
  ubicacion: string;
  descripcion: string;
  habitaciones: number;
  banos: number;
  estacionamientos: number;
  m2: number;
  imagenes: string[];
  lat: number;
  lng: number;
  caracteristicas?: string[];
}

@Injectable({ providedIn: 'root' })
export class PropiedadesService {
  private apiUrl = '/api/propiedades';

  constructor(private http: HttpClient) {}

  listar(tipo?: string): Observable<Propiedad[]> {
    const url = tipo && tipo !== 'Todos'
      ? `${this.apiUrl}?tipo=${encodeURIComponent(tipo)}`
      : this.apiUrl;
    return this.http.get<Propiedad[]>(url);
  }

  obtenerPorId(id: number): Observable<Propiedad> {
    return this.http.get<Propiedad>(`${this.apiUrl}/${id}`);
  }
}