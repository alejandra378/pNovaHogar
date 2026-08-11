import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService, Rol } from '../../services/usuarios';

@Component({
  selector: 'app-catalogo-usuarios',
  imports: [CommonModule],
  templateUrl: './catalogo-usuarios.html',
  styleUrl: './catalogo-usuarios.css'
})
export class CatalogoUsuarios implements OnInit {
  usuarios: any[] = [];
  sesionEmail = '';
  mensaje = '';
  error = '';

  constructor(
    private usuariosService: UsuariosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const sesion = this.usuariosService.obtenerSesion();
    if (!sesion) { this.router.navigate(['/login']); return; }
    this.sesionEmail = sesion.email;
    this.cargar();
  }

  cargar(): void { this.usuarios = this.usuariosService.listarUsuarios(); }

  cambiarRol(email: string, rol: Rol): void {
    this.mensaje = ''; this.error = '';
    if (email === this.sesionEmail) { this.error = 'No puedes cambiar tu propio rol.'; return; }
    this.usuariosService.cambiarRol(email, rol);
    this.mensaje = `Rol actualizado para ${email}.`;
    this.cargar();
  }

  eliminar(email: string): void {
    this.mensaje = ''; this.error = '';
    if (email === this.sesionEmail) { this.error = 'No puedes eliminarte a ti mismo.'; return; }
    if (!confirm(`¿Eliminar al usuario ${email}?`)) return;
    this.usuariosService.eliminarUsuario(email);
    this.mensaje = `Usuario ${email} eliminado.`;
    this.cargar();
  }

  desbloquear(email: string): void {
    this.usuariosService.desbloquearUsuario(email);
    this.mensaje = `Cuenta ${email} desbloqueada.`;
    this.cargar();
  }

  estaBloqueado(u: any): boolean {
    return u.bloqueadoHasta && u.bloqueadoHasta > Date.now();
  }

  volver(): void { this.router.navigate(['/panel-admin']); }

  cerrarSesion(): void {
    this.usuariosService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}