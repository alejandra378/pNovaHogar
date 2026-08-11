import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aviso-privacidad',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './aviso-privacidad.html',
  styleUrl: './aviso-privacidad.css'
})
export class AvisoPrivacidad {
  secciones = [
    { id: 'responsable', titulo: '1. Identidad y domicilio del responsable' },
    { id: 'datos', titulo: '2. Datos personales que recabamos' },
    { id: 'finalidades', titulo: '3. Finalidades del tratamiento' },
    { id: 'fundamento', titulo: '4. Fundamento legal' },
    { id: 'transferencias', titulo: '5. Transferencia de datos' },
    { id: 'arco', titulo: '6. Derechos ARCO y revocación' },
    { id: 'seguridad', titulo: '7. Medidas de seguridad' },
    { id: 'cookies', titulo: '8. Uso de cookies y tecnologías de rastreo' },
    { id: 'menores', titulo: '9. Datos de menores de edad' },
    { id: 'cambios', titulo: '10. Cambios al aviso de privacidad' },
    { id: 'contacto', titulo: '11. Contacto' }
  ];
}