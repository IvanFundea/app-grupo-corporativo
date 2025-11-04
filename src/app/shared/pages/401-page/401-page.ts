import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page-401',
  imports: [],
  templateUrl: './401-page.html',
  styleUrl: './401-page.css',
})
export default class Page401Component { 
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}