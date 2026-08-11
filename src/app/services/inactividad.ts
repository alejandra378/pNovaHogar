import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { UsuariosService } from './usuarios';

@Injectable({
  providedIn: 'root'
})
export class InactividadService implements OnDestroy {
  private minutosInactividad = 1;
  private temporizador: any;
  private activo = false;
  private isBrowser: boolean;

  private eventos = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  iniciar(): void {
    if (!this.isBrowser || this.activo) return;

    this.activo = true;

    this.eventos.forEach(evento => {
      window.addEventListener(evento, this.reiniciarTemporizador);
    });

    this.reiniciarTemporizador();
  }

  detener(): void {
    if (!this.isBrowser) return;

    this.activo = false;

    this.eventos.forEach(evento => {
      window.removeEventListener(evento, this.reiniciarTemporizador);
    });

    clearTimeout(this.temporizador);
  }

  private reiniciarTemporizador = (): void => {
    if (!this.usuariosService.haySesion()) return;

    this.usuariosService.actualizarActividad();

    clearTimeout(this.temporizador);

    this.temporizador = setTimeout(() => {
      this.usuariosService.cerrarSesion();
      alert('La sesión se cerró por inactividad.');
      this.router.navigate(['/login']);
    }, this.minutosInactividad * 300 * 1000);
  };

  ngOnDestroy(): void {
    this.detener();
  }
}