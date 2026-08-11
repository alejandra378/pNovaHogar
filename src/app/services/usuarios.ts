import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Rol = 'admin' | 'usuario';

export interface Usuario {
  nombre: string;
  email: string;
  passwordHash: string;
  intentosFallidos: number;
  bloqueadoHasta: number | null;
  rol: Rol;
  activo: boolean;
  fechaBaja: number | null;
  fechaRetencionHasta: number | null;
}

export interface Sesion {
  email: string;
  nombre: string;
  rol: Rol;
  inicio: number;
  ultimaActividad: number;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private usuariosKey = 'novahogar_usuarios';
  private sesionKey = 'novahogar_sesion';
  private minutosBloqueo = 5;
  private aniosRetencion = 5;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.inicializarAdmin();
    this.depurarUsuariosVencidos();
  }

  private async inicializarAdmin(): Promise<void> {
    if (!this.isBrowser) return;
    const usuarios = this.obtenerUsuarios();
    const existe = usuarios.some(u => u.email === 'admin@novahogar.com');
    if (!existe) {
      const hash = await this.generarHash('Admin@123!');
      usuarios.push({
        nombre: 'Administrador',
        email: 'admin@novahogar.com',
        passwordHash: hash,
        intentosFallidos: 0,
        bloqueadoHasta: null,
        rol: 'admin',
        activo: true,
        fechaBaja: null,
        fechaRetencionHasta: null
      });
      this.guardarUsuarios(usuarios);
    }
  }

  validarPassword(password: string): string[] {
    const errores: string[] = [];
    if (password.length < 8) errores.push('La contraseña debe tener mínimo 8 caracteres.');
    if (!/[A-Z]/.test(password)) errores.push('Debe incluir mínimo una letra mayúscula.');
    if (!/[a-z]/.test(password)) errores.push('Debe incluir mínimo una letra minúscula.');
    if (!/[^A-Za-z0-9]/.test(password)) errores.push('Debe incluir mínimo un carácter especial.');
    if (this.tieneNumerosConsecutivos(password)) errores.push('No debe contener números consecutivos.');
    if (this.tieneLetrasConsecutivas(password)) errores.push('No debe contener letras consecutivas del abecedario.');
    return errores;
  }

  async registrar(nombre: string, email: string, password: string) {
    const usuarios = this.obtenerUsuarios();
    const existe = usuarios.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (existe) return { ok: false, mensaje: 'Este correo ya está registrado.', errores: [] };
    const errores = this.validarPassword(password);
    if (errores.length > 0) return { ok: false, mensaje: 'La contraseña no cumple con los requisitos.', errores };
    usuarios.push({
      nombre, email,
      passwordHash: await this.generarHash(password),
      intentosFallidos: 0,
      bloqueadoHasta: null,
      rol: 'usuario',
      activo: true,
      fechaBaja: null,
      fechaRetencionHasta: null
    });
    this.guardarUsuarios(usuarios);
    return { ok: true, mensaje: 'Usuario registrado correctamente.', errores: [] };
  }

  async login(email: string, password: string) {
    const usuarios = this.obtenerUsuarios();
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!usuario) return { ok: false, mensaje: 'Correo o contraseña incorrectos.' };

    if (usuario.activo === false) {
      return {
        ok: false,
        mensaje: 'Esta cuenta fue dada de baja por el titular. Ya no es posible iniciar sesión.'
      };
    }

    const ahora = Date.now();
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
      const min = Math.ceil((usuario.bloqueadoHasta - ahora) / 60000);
      return { ok: false, mensaje: `La cuenta está bloqueada. Intenta de nuevo en ${min} minuto(s).` };
    }
    const passwordHash = await this.generarHash(password);
    if (usuario.passwordHash !== passwordHash) {
      usuario.intentosFallidos++;
      if (usuario.intentosFallidos >= 3) {
        usuario.bloqueadoHasta = Date.now() + this.minutosBloqueo * 60 * 1000;
        usuario.intentosFallidos = 0;
        this.guardarUsuarios(usuarios);
        return { ok: false, mensaje: `Cuenta bloqueada por ${this.minutosBloqueo} minutos por 3 intentos fallidos.` };
      }
      this.guardarUsuarios(usuarios);
      return { ok: false, mensaje: `Contraseña incorrecta. Intentos restantes: ${3 - usuario.intentosFallidos}.` };
    }
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    this.guardarUsuarios(usuarios);
    const sesion: Sesion = {
      email: usuario.email, nombre: usuario.nombre, rol: usuario.rol,
      inicio: Date.now(), ultimaActividad: Date.now()
    };
    if (this.isBrowser) localStorage.setItem(this.sesionKey, JSON.stringify(sesion));
    return { ok: true, mensaje: 'Inicio de sesión correcto.' };
  }

  obtenerSesion(): Sesion | null {
    if (!this.isBrowser) return null;
    const data = localStorage.getItem(this.sesionKey);
    return data ? JSON.parse(data) : null;
  }

  haySesion(): boolean { return this.obtenerSesion() !== null; }
  esAdmin(): boolean { return this.obtenerSesion()?.rol === 'admin'; }

  actualizarActividad(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !this.isBrowser) return;
    sesion.ultimaActividad = Date.now();
    localStorage.setItem(this.sesionKey, JSON.stringify(sesion));
  }

  cerrarSesion(): void {
    if (this.isBrowser) localStorage.removeItem(this.sesionKey);
  }

  listarUsuarios(): Omit<Usuario, 'passwordHash'>[] {
    return this.obtenerUsuarios().map(({ passwordHash, ...rest }) => rest);
  }

  cambiarRol(email: string, nuevoRol: Rol): void {
    const usuarios = this.obtenerUsuarios();
    const u = usuarios.find(u => u.email === email);
    if (u) { u.rol = nuevoRol; this.guardarUsuarios(usuarios); }
  }

  eliminarUsuario(email: string): void {
    const sesion = this.obtenerSesion();
    if (sesion?.email === email) return;
    this.guardarUsuarios(this.obtenerUsuarios().filter(u => u.email !== email));
  }

  desbloquearUsuario(email: string): void {
    const usuarios = this.obtenerUsuarios();
    const u = usuarios.find(u => u.email === email);
    if (u) { u.bloqueadoHasta = null; u.intentosFallidos = 0; this.guardarUsuarios(usuarios); }
  }

  /**
   * Revocación del consentimiento / baja de cuenta a solicitud del titular.
   * NO borra los datos: los marca como inactivos y fija la fecha límite de
   * retención legal (5 años), conforme al deber de conservación de datos.
   * El usuario deja de poder iniciar sesión desde este momento.
   */
  solicitarBajaCuenta(email: string): { ok: boolean; mensaje: string } {
    const usuarios = this.obtenerUsuarios();
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!usuario) return { ok: false, mensaje: 'Usuario no encontrado.' };
    if (usuario.rol === 'admin') {
      return { ok: false, mensaje: 'La cuenta de administrador no puede darse de baja.' };
    }

    const ahora = Date.now();
    const retencion = new Date(ahora);
    retencion.setFullYear(retencion.getFullYear() + this.aniosRetencion);

    usuario.activo = false;
    usuario.fechaBaja = ahora;
    usuario.fechaRetencionHasta = retencion.getTime();

    this.guardarUsuarios(usuarios);
    this.cerrarSesion();

    return {
      ok: true,
      mensaje: 'Tu cuenta fue dada de baja. Tus datos se conservarán de forma bloqueada ' +
        `hasta ${retencion.toLocaleDateString('es-MX')} por obligación legal y después serán eliminados.`
    };
  }

  /**
   * Elimina definitivamente las cuentas cuya retención legal ya venció.
   * En un backend real esto sería un job programado; aquí se simula
   * revisándolo cada vez que se inicializa el servicio.
   */
  private depurarUsuariosVencidos(): void {
    const ahora = Date.now();
    const usuarios = this.obtenerUsuarios();
    const vigentes = usuarios.filter(u => {
      if (u.activo) return true;
      if (!u.fechaRetencionHasta) return true;
      return u.fechaRetencionHasta > ahora;
    });
    if (vigentes.length !== usuarios.length) this.guardarUsuarios(vigentes);
  }

  private obtenerUsuarios(): Usuario[] {
    if (!this.isBrowser) return [];
    const data = localStorage.getItem(this.usuariosKey);
    if (!data) return [];

    const usuarios: Usuario[] = JSON.parse(data);
    let necesitaGuardar = false;

    for (const u of usuarios) {
      if (u.activo === undefined) { u.activo = true; necesitaGuardar = true; }
     if (u.fechaBaja === undefined) { u.fechaBaja = null; necesitaGuardar = true; }
      if (u.fechaRetencionHasta === undefined) { u.fechaRetencionHasta = null; necesitaGuardar = true; }
    }

    if (necesitaGuardar && this.isBrowser) {
      localStorage.setItem(this.usuariosKey, JSON.stringify(usuarios));
    }

    return usuarios;
  }

  private guardarUsuarios(usuarios: Usuario[]): void {
    if (this.isBrowser) localStorage.setItem(this.usuariosKey, JSON.stringify(usuarios));
  }

  private tieneNumerosConsecutivos(password: string): boolean {
    for (let i = 0; i < password.length - 1; i++) {
      const a = password[i], b = password[i + 1];
      if (/\d/.test(a) && /\d/.test(b) && Math.abs(Number(a) - Number(b)) === 1) return true;
    }
    return false;
  }

  private tieneLetrasConsecutivas(password: string): boolean {
    const txt = password.toLowerCase();
    for (let i = 0; i < txt.length - 1; i++) {
      const a = txt[i], b = txt[i + 1];
      if (/[a-z]/.test(a) && /[a-z]/.test(b) && Math.abs(a.charCodeAt(0) - b.charCodeAt(0)) === 1) return true;
    }
    return false;
  }

  private async generarHash(texto: string): Promise<string> {
    if (!this.isBrowser || !window.crypto?.subtle) return texto;
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}