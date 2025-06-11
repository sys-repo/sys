import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../common.ts';

/**
 * Service Worker:
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const devmode = import.meta.env.DEV;
    const prefix = devmode ? `[main:dev]` : `[main]`;
    const title = devmode ? 'ServiceWorker-Sample' : 'ServiceWorker';
    navigator.serviceWorker
      .register('sw.js', { type: 'module' })
      .then((reg) => console.info(`🌳 ${prefix} ${title} registered with scope: ${reg.scope}`))
      .catch((err) => console.error(`💥 ${prefix} ${title} registration failed:`, err));
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
    const { render, useKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./-specs.ts');

    const el = await render(pkg, Specs, {
      style: { Absolute: 0 },
      hr: (e) => {
        if (e.prev?.endsWith(': ObjectView')) return true;
        if (e.prev?.endsWith(': Config.Slider')) return true;
        if (e.next?.endsWith('.player: Video.VidStack')) return true;
        if (e.prev?.endsWith(': Recorder')) return true;
      },
    });
    function App() {
      useKeyboard();
      return el;
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } else {
    const { Splash } = await import('./ui.Splash.tsx');
    root.render(
      <StrictMode>
        <Splash style={{ Absolute: 0 }} />
      </StrictMode>,
    );
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
