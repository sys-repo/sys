import React from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../pkg.ts';

/**
 * Service Worker:
 */
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('sw.js', import.meta.url), { type: 'module' })
      .then((reg) => console.info(`🌳 [main] ServiceWorker registered with scope: ${reg.scope}`))
      .catch((err) => console.error(`💥 [main] ServiceWorker registration failed:`, err));
  });
}

/**
 * Render UI:
 */
console.info('🐷 ./entry.tsx → Pkg:💦', pkg);
const document = globalThis.document;
if (document) {
  document.title = pkg.name;
  document.body.style.overflow = 'hidden'; // NB: suppress rubber-band effect.
}

export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');
  const root = createRoot(document.getElementById('root')!);

  if (isDev) {
    /**
     * DevHarness:
     */
    const { render, useKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./-specs.ts');
    const el = await render(pkg, Specs, {
      style: { Absolute: 0 },
      hr(e) {
        if (e.next?.endsWith('.SlugPlayback')) return true;
        if (e.next?.endsWith('.dev.Origin')) return true;
      },
    });

    function App() {
      useKeyboard();
      return el;
    }

    const app = <App />;
    root.render(<React.StrictMode>{app}</React.StrictMode>);
  } else {
    /**
     * Entry/Splash:
     */
    const { useKeyboard } = await import('@sys/ui-react-devharness');
    const { Splash } = await import('./ui.Splash.tsx');

    function App() {
      useKeyboard();
      return <Splash />;
    }

    const app = <App />;
    root.render(<React.StrictMode>{app}</React.StrictMode>);
  }
}

main().catch((err) => console.error(`💥 Failed to render DevHarness`, err));
