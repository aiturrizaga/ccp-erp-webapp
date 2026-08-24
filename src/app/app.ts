import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  // Unstyled custom elements default to `display: inline`, which breaks width calculations for the
  // flex/grid layout rendered inside (router-outlet inserts the routed component as a sibling, so this
  // host's own box still wraps it in the accessibility/layout tree).
  host: { class: 'contents' },
  template: '<router-outlet/>',
})
export class App {
}
