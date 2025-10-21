import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';

@Component({
  selector: 'app-movimientos-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent],
  templateUrl: './movimientos-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MovimientosPageComponent { }
