import React from 'react';
import { createRoot } from 'react-dom/client';
import { Http } from '@sys/http/client';
import { pkg } from '../pkg.ts';

/**
 * Service Worker:
 */
if (!import.meta.env.DEV) {
  const registerSw = async () => {
    const observation = await Http.ServiceWorker.register({
      scriptUrl: new URL('../sw.js', import.meta.url),
      options: { type: 'module' },
    });
    console.info(`🌳 [main] ServiceWorker observation: ${observation.kind}`);
  };

  if (globalThis.document.readyState === 'complete') {
    void registerSw();
  } else {
    globalThis.addEventListener('load', registerSw, { once: true });
  }
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
  const root = createRoot(document.getElementById('root')!);

  if (import.meta.env.DEV) {
    const params = new URL(globalThis.location.href).searchParams;
    if (params.has('dev') || params.has('d')) {
      const { render, useKeyboard } = await import('@sys/ui-dev/react/devharness');
      const { Specs } = await import('./-specs.ts');
      const el = await render(pkg, Specs, {
        style: { Absolute: 0 },
        hr: () => {},
      });

      const App = () => {
        useKeyboard();
        return el;
      };

      root.render(<React.StrictMode>{<App />}</React.StrictMode>);
      return;
    }
  }

  const { Splash } = await import('./entry.splash.tsx');
  root.render(<React.StrictMode>{<Splash />}</React.StrictMode>);
}

main().catch((err) => console.error(`💥 Failed to render Driver Pi`, err));
