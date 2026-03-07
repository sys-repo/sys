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

  if (isDev) {
    /**
     * DevHarness:
     */
    const { render, useKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./-specs.ts');
    const el = await render(pkg, Specs, {
      hr: (e) => {
        if (e.next?.endsWith('ui.Repo')) return true;
        if (e.prev?.endsWith('ui.Layout')) return true;
      },
      style: { Absolute: 0 },
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
    const { spawnUiRepoWorker } = await import('../ui/-test.ui.repo.ts');
    const { Splash } = await import('./ui.Splash.tsx');
    const repo = await spawnUiRepoWorker();

    function App() {
      useKeyboard();
      return <Splash repo={repo} />;
    }

    const app = <App />;
    root.render(<React.StrictMode>{app}</React.StrictMode>);
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
