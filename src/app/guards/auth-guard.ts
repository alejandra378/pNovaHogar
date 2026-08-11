import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuariosService } from '../services/usuarios';

export const authGuard: CanActivateFn = () => {
  const usuarios = inject(UsuariosService);
  const router = inject(Router);
  if (usuarios.haySesion()) return true;
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const usuarios = inject(UsuariosService);
  const router = inject(Router);
  if (usuarios.esAdmin()) return true;
  router.navigate(['/home']);
  return false;
};