import { render, h } from 'preact';
import { AppMain } from './AppMain';

async function boot() {
  console.log('Booting Preact app...');

  // Mount to body to replace the static layout
  const root = document.getElementById('app') || document.body;
  if (root) {
    render(h(AppMain, {}), root);
    console.log('App rendered');
  }
}

if (typeof document !== 'undefined') {
  boot();
}
