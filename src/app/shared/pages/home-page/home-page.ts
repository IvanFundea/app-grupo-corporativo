import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../components/custom-icon/custom-icon.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePageComponent { }
