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
import { InactividadService } from '../../services/inactividad';

declare const grecaptcha: any;

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, AfterViewInit {
  email = '';
  password = '';

  siteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  recaptchaToken = '';
  widgetId: number | null = null;

  error = '';
  mensaje = '';

  private isBrowser: boolean;

  constructor(
    private usuariosService: UsuariosService,
    private inactividadService: InactividadService,
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
        this.widgetId = grecaptcha.render('recaptchaLogin', {
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

  async entrar(): Promise<void> {
    this.error = '';
    this.mensaje = '';

    if (!this.email || !this.password) {
      this.error = 'Ingresa correo y contraseña.';
      return;
    }

    if (!this.recaptchaToken) {
      this.error = 'Confirma el reCAPTCHA.';
      return;
    }

    const resultado = await this.usuariosService.login(this.email, this.password);

    if (!resultado.ok) {
      this.error = resultado.mensaje;
      this.resetRecaptcha();
      return;
    }

    this.mensaje = resultado.mensaje;
    this.inactividadService.iniciar();

    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 500);
  }

  resetRecaptcha(): void {
    if (!this.isBrowser) return;

    this.recaptchaToken = '';

    if (this.widgetId !== null && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset(this.widgetId);
    }
  }
}