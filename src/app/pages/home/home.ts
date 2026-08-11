import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UsuariosService, Sesion } from '../../services/usuarios';
import { InactividadService } from '../../services/inactividad';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  sesion: Sesion | null = null;
  mostrarConfirmacionBaja = false;
  mensajeBaja = '';

  constructor(
    private usuariosService: UsuariosService,
    private inactividadService: InactividadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sesion = this.usuariosService.obtenerSesion();
    if (!this.sesion) { this.router.navigate(['/login']); return; }
    this.inactividadService.iniciar();
  }

  irAdminPanel(): void { this.router.navigate(['/panel-admin']); }

  cerrarSesion(): void {
    this.usuariosService.cerrarSesion();
    this.inactividadService.detener();
    this.router.navigate(['/login']);
  }

  confirmarBajaCuenta(): void {
    if (!this.sesion) return;
    const resultado = this.usuariosService.solicitarBajaCuenta(this.sesion.email);
    this.mostrarConfirmacionBaja = false;
    this.mensajeBaja = resultado.mensaje;

    if (resultado.ok) {
      this.inactividadService.detener();
      setTimeout(() => this.router.navigate(['/login']), 2500);
    }
  }
}