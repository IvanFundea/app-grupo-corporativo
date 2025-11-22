import { RouterOutlet } from '@angular/router';

import { ChangeDetectionStrategy, Component, signal, } from '@angular/core';


import { LucideAngularModule, SquarePen, Trash2 } from 'lucide-angular';
import { HoverAccordionComponent } from '../../../test/components/hover-accordion/hover-accordion.component';


@Component({
  selector: 'app-test-page',
  imports: [LucideAngularModule, HoverAccordionComponent],
  templateUrl: './test-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TestPageComponent {

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
  }

  async fetchData() {
    
  }

}
