import { Component, computed, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-custom-icon',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (iconExists()) {
      <lucide-icon [name]="normalizedName()" [color]="effectiveColor()" [size]="size()" [strokeWidth]="strokeWidth()" [attr.class]="class()"></lucide-icon>
    } @else {
      <lucide-icon name="help-circle" class="text-red-500"></lucide-icon>
    }
  `,
})
export class CustomIconComponent {
  name = input.required<string>();
  class = input<string>('');
  color = input<string>('');
  size = input<number>(20);
  strokeWidth = input<number>(2);

  // Color primario de la paleta corporativa como valor por defecto
  private readonly DEFAULT_COLOR = '#1E335E'; // primario HVC Kapital

  normalizedName = computed(() => (this.name() || '').toLowerCase().trim());
  iconExists = computed(() => !!this.normalizedName());
  
  // Computed que retorna el color efectivo (input o por defecto)
  effectiveColor = computed(() => this.color() || this.DEFAULT_COLOR);
}
