import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService, Sesion } from '../../services/usuarios';
import { InactividadService } from '../../services/inactividad';

@Component({
  selector: 'app-panel-admin',
  imports: [CommonModule],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css'
})
export class PanelAdmin implements OnInit {
  sesion: Sesion | null = null;
  totalUsuarios = 0;
  totalAdmins = 0;

  constructor(
    private usuariosService: UsuariosService,
    private inactividadService: InactividadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sesion = this.usuariosService.obtenerSesion();
    if (!this.sesion) { this.router.navigate(['/login']); return; }
    this.inactividadService.iniciar();
    const usuarios = this.usuariosService.listarUsuarios();
    this.totalUsuarios = usuarios.length;
    this.totalAdmins = usuarios.filter(u => u.rol === 'admin').length;
  }

  irCatalogo(): void { this.router.navigate(['/catalogo-usuarios']); }

  cerrarSesion(): void {
    this.usuariosService.cerrarSesion();
    this.inactividadService.detener();
    this.router.navigate(['/login']);
  }
}