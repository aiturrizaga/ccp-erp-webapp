import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmSidebarImports } from '@ui/sidebar';
import { Topbar } from '../topbar/topbar';
import { Sidebar } from '../sidebar/sidebar';

/** Root chrome, mirrors spartan/ui's "sidebar-inset" block: collapsible icon sidebar + inset main content. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, ...HlmSidebarImports, Topbar, Sidebar],
  // See app.ts — keeps this purely structural host out of the box-model chain.
  host: { class: 'contents' },
  templateUrl: './layout.html',
})
export class Layout {}
