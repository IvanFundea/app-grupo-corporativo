import { Component, Input, computed, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-custom-icon',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (iconExists()) {
      <lucide-icon [name]="normalizedName()" [color]="effectiveColor()" [size]="size" [strokeWidth]="strokeWidth" [attr.class]="class"></lucide-icon>
    } @else {
      <lucide-icon name="help-circle" class="text-red-500"></lucide-icon>
    }
  `,
})
export class CustomIconComponent {
  @Input({ required: true }) name!: string;
  @Input() class?: string;
  @Input() color?: string; // Sin valor por defecto aquí
  @Input() size?: number = 20;
  @Input() strokeWidth?: number = 2;

  // Color primario de la paleta corporativa como valor por defecto
  private readonly DEFAULT_COLOR = 'rgb(50, 50, 50)'; // primary-500

  normalizedName = computed(() => this.name?.toLowerCase());
  iconExists = computed(() => !!this.normalizedName());
  
  // Computed que retorna el color efectivo (input o por defecto)
  effectiveColor = computed(() => this.color || this.DEFAULT_COLOR);
}
