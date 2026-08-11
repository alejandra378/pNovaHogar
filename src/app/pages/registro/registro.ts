import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuariosService } from '../../services/usuarios';

declare const grecaptcha: any;

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro implements OnInit, AfterViewInit {
  nombre = '';
  email = '';
  password = '';
  confirmarPassword = '';
  aceptoAviso = false;

  siteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  recaptchaToken = '';
  widgetId: number | null = null;

  erroresPassword: string[] = [];
  mensaje = '';
  error = '';

  private isBrowser: boolean;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const intervalo = setInterval(() => {
      if (typeof grecaptcha !== 'undefined' && this.widgetId === null) {
        this.widgetId = grecaptcha.render('recaptchaRegistro', {
          sitekey: this.siteKey,
          callback: (token: string) => {
            this.recaptchaToken = token;
          },
          'expired-callback': () => {
            this.recaptchaToken = '';
          }
        });

        clearInterval(intervalo);
      }
    }, 500);
  }

  actualizarErrores(): void {
    this.erroresPassword = this.usuariosService.validarPassword(this.password);
  }

  async registrar(): Promise<void> {
    this.mensaje = '';
    this.error = '';
    this.actualizarErrores();

    if (!this.nombre || !this.email || !this.password || !this.confirmarPassword) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (this.password !== this.confirmarPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.erroresPassword.length > 0) {
      this.error = 'La contraseña no cumple con los requisitos.';
      return;
    }

    if (!this.aceptoAviso) {
      this.error = 'Debes aceptar el Aviso de Privacidad para continuar.';
      return;
    }

    if (!this.recaptchaToken) {
      this.error = 'Confirma el reCAPTCHA.';
      return;
    }

    const resultado = await this.usuariosService.registrar(
      this.nombre,
      this.email,
      this.password
    );

    if (!resultado.ok) {
      this.error = resultado.mensaje;
      this.erroresPassword = resultado.errores;
      this.resetRecaptcha();
      return;
    }

    this.mensaje = resultado.mensaje;

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 800);
  }

  resetRecaptcha(): void {
    if (!this.isBrowser) return;

    this.recaptchaToken = '';

    if (this.widgetId !== null && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset(this.widgetId);
    }
  }
}