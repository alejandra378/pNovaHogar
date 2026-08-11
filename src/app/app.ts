import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactividadService } from './services/inactividad';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(private inactividadService: InactividadService) {}

  ngOnInit(): void {
    this.inactividadService.iniciar();
  }
}