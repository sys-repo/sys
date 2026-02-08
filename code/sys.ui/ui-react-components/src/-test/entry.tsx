import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../common.ts';

/**
 * Service Worker:
 */
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('../sw.js', import.meta.url), { type: 'module' })
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
    const { render, useKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./-specs.ts');

    const el = await render(pkg, Specs, {
      style: { Absolute: 0 },
      hr(e) {
        if (e.next?.endsWith(': Button')) return true;
        if (e.next?.endsWith(': Bullet')) return true;
        if (e.next?.startsWith('sys.ui.css: @container')) return true;
        if (e.next?.endsWith(': Layout.CenterColumn')) return true;
        if (e.next?.endsWith(': Http.Origin')) return true;
        if (e.next?.endsWith(': TreeView.Index')) return true;
        if (e.next?.endsWith(': Prose.Measure')) return true;
        if (e.next?.endsWith(': Player.Video: Element')) return true;
        if (e.next?.endsWith(': Recorder')) return true;
        if (e.next?.endsWith(': Dist')) return true;
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
