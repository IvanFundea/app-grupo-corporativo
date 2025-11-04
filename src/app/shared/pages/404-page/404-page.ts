import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page-404',
  imports: [],
  templateUrl: './404-page.html',
  styleUrl: './404-page.css',
})
export default class Page404Component { 
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}