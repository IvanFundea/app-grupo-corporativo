import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomIconComponent } from '../../../../shared/components/custom-icon/custom-icon.component';

@Component({
  selector: 'app-side-menu-list',
  imports: [CustomIconComponent],
  templateUrl: './side-menu-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideMenuListComponent { }
