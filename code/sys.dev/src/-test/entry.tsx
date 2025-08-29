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
    const el = await render(pkg, Specs, { hr: (e) => {}, style: { Absolute: 0 } });

    function App() {
      useKeyboard();
      return el;
    }

    const app = <App />;
    root.render(<React.StrictMode>{app}</React.StrictMode>);
  } else {
    /**
     * Catalog:
     */
    const { useFactory } = await import('@sys/ui-factory/adapter/react');
    const { ValidationErrors } = await import('@sys/ui-factory/components/react');
    const { Factory } = await import('@sys/ui-factory/core');

    const { css } = await import('@sys/ui-css');
    const { regs, makePlan } = await import('../ui/catalog.concept-player/mod.ts');

    const factory = Factory.make(regs);
    const plan = makePlan();

    function App() {
      const catalog = useFactory(factory, plan, { strategy: 'eager', validate: false });
      const { issues, element } = catalog;
      return catalog.ok ? element : <ValidationErrors errors={issues.validation} />;
    }

    root.render(
      <React.StrictMode>
        <div className={css({ Absolute: 0, display: 'grid' }).class}>
          <App />
        </div>
      </React.StrictMode>,
    );
  }
}

main().catch((err) => console.error(`💥 Failed to render DevHarness`, err));
