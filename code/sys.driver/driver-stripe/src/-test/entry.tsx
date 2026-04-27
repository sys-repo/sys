import React from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../pkg.ts';
import { PaymentElementSample } from './ui.PaymentElement.Sample.tsx';

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
  const root = createRoot(document.getElementById('root')!);

  if (import.meta.env.DEV) return renderDevHarness(root);
  return renderSample(root);
}

async function renderDevHarness(root: ReturnType<typeof createRoot>) {
  const { render, useKeyboard } = await import('@sys/ui-react-devharness');
  const { Specs } = await import('./-specs.ts');
  const el = await render(pkg, Specs, {
    style: { Absolute: 0 },
    hr: () => {},
  });

  function App() {
    useKeyboard();
    return el;
  }

  root.render(<React.StrictMode><App /></React.StrictMode>);
}

function renderSample(root: ReturnType<typeof createRoot>) {
  root.render(
    <React.StrictMode>
      <PaymentElementSample />
    </React.StrictMode>,
  );
}

main().catch((err) => console.error(`💥 Failed to render Stripe.PaymentElement`, err));
