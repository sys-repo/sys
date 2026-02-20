import React from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../pkg.ts';

/**
 * Service Worker:
 */
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  async function registerSw() {
    try {
      const reg = await navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), {
        type: 'module',
      });
      console.info(`🌳 [main] ServiceWorker registered with scope: ${reg.scope}`);
    } catch (err) {
      console.error(`💥 [main] ServiceWorker registration failed:`, err);
    }
  }

  if (globalThis.document.readyState === 'complete') {
    void registerSw();
  } else {
    window.addEventListener('load', registerSw, { once: true });
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

/**
 * MAIN entry:
 */
export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');
  const root = createRoot(document.getElementById('root')!);

  /**
   * DevHarness:
   */
  const { render, useKeyboard } = await import('@sys/ui-react-devharness');
  const { Specs } = await import('./-specs.ts');
  const el = await render(pkg, Specs, {
    style: { Absolute: 0 },
    hr(e) {
      if (e.next?.endsWith('ui.YamlEditor')) return true;
      if (e.next?.includes('Sample')) return true;
    },
  });
  function App() {
    useKeyboard();
    return el;
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
