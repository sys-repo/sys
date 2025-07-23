import React from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../pkg.ts';

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
  const el = await render(pkg, Specs, { hr: (e) => {}, style: { Absolute: 0 } });
  function App() {
    useKeyboard();
    return el;
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  if (isDev) {
  } else {
    /**
     * Main:
     */
    // const { MonacoEditor } = await import('@sys/driver-monaco');
    // root.render(
    //   <React.StrictMode>
    //     <MonacoEditor style={{ Absolute: 0 }} theme={'Dark'} />
    //   </React.StrictMode>,
    // );
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
