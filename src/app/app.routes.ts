import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Home } from './pages/home/home';
import { PanelAdmin } from './pages/panel-admin/panel-admin';
import { CatalogoUsuarios } from './pages/catalogo-usuarios/catalogo-usuarios';
import { authGuard, adminGuard } from './guards/auth-guard';
import { AvisoPrivacidad } from './pages/aviso-privacidad/aviso-privacidad';
import { Catalogo } from './pages/catalogo/catalogo';
import { DetallePropiedad } from './pages/detalle-propiedad/detalle-propiedad';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'aviso-privacidad', component: AvisoPrivacidad },   
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'panel-admin', component: PanelAdmin, canActivate: [authGuard, adminGuard] },
  { path: 'catalogo-usuarios', component: CatalogoUsuarios, canActivate: [authGuard, adminGuard] },
  { path: 'catalogo', component: Catalogo, canActivate: [authGuard] },
  { path: 'detalle-propiedad/:id', component: DetallePropiedad, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];