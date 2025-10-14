import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomIconComponent } from '../../../../shared/components/custom-icon/custom-icon.component';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-side-menu-list',
  imports: [CustomIconComponent, RouterLink, RouterLinkActive],
  templateUrl: './side-menu-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideMenuListComponent { }
