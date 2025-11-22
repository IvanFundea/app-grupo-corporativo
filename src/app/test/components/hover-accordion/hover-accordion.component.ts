import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hover-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hover-accordion.component.html',
})
export class HoverAccordionComponent {
  activeSection = signal<'general' | 'laboral' | 'educativa' | 'direcciones' | null>('general');

  onMouseEnter(section: 'general' | 'laboral' | 'educativa' | 'direcciones') {
    this.activeSection.set(section);
  }

  onMouseLeave() {
    
  }
}
