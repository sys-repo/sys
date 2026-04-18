import React from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../pkg.ts';

/**
 * Service Worker:
 */
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  async function registerSw() {
    try {
      const url = new URL('../sw.js', import.meta.url);
      const reg = await navigator.serviceWorker.register(url, { type: 'module' });
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

export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');
  const root = createRoot(document.getElementById('root')!);

  /**
   * DevHarness:
   */
  async function renderDev() {
    const { render, useKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./-specs.ts');
    const el = await render(pkg, Specs, {
      style: { Absolute: 0 },
      hr: (e) => {
        if (e.next?.includes(': dev/ui.HttpDataCards')) return true;
      },
    });

    function App() {
      useKeyboard();
      return el;
    }

    const app = <App />;
    root.render(<React.StrictMode>{app}</React.StrictMode>);
  }

  /**
   * Entry/Splash:
   */
  async function renderSplash() {
    const { Splash } = await import('./entry.splash.tsx');
    root.render(<React.StrictMode>{<Splash />}</React.StrictMode>);
  }

  if (isDev) {
    return void renderDev();
  } else {
    return void renderSplash();
  }
}

main().catch((err) => console.error(`💥 Failed to render DevHarness`, err));
