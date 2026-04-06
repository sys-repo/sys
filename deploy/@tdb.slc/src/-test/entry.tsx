import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import type { t } from '../common.ts';
import { pkg } from '../pkg.ts';
import { useKeyboard } from '../ui/use/use.Keyboard.ts';
import { WarmVideo } from '../ui.content/ui/m.VideoWarmup.ts';

/**
 * Service Worker:
 */
if ('serviceWorker' in navigator && !location.hostname.startsWith('localhost')) {
  window.addEventListener('load', () => {
    const pathname = location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`;
    const sw = `${pathname}sw.js`;
    navigator.serviceWorker
      .register(sw, { type: 'module', scope: pathname })
      .then((reg) => console.info(`🌳 [main] ServiceWorker registered with scope: ${reg.scope}`))
      .catch((err) => console.error(`💥 [main] ServiceWorker registration failed:`, err));
  });
}

/**
 * Render UI.
 */
const document = globalThis.document;
if (document) {
  document.title = 'Social Lean Canvas';
  document.body.style.overflow = 'hidden'; // NB: suppress rubber-band effect.
}

/**
 * Setup mounter:
 */
const Root = (props: { state: t.AppSignals; children?: t.ReactNode }) => {
  useKeyboard(props.state);
  return props.children;
};

/**
 * MAIN entry.
 */
export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');
  const root = createRoot(document.getElementById('root')!);

  if (isDev) {
    /**
     * DevHarness:
     */
    const { App } = await import('../ui/App/mod.ts');
    const { render, useKeyboard: useDevKeyboard } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./-specs.ts');

    const DevRoot = (props: { state: t.AppSignals; children?: t.ReactNode }) => {
      useKeyboard(props.state);
      useDevKeyboard();
      return props.children;
    };

    const app = App.signals();
    const el = await render(pkg, Specs, {
      hr: (e) => e.byRoots(['tdb.slc.', 'sys.ui', 'tdb.slc.ui.Canvas']),
      style: { Absolute: 0 },
    });

    root.render(
      <StrictMode>
        <DevRoot state={app}>{el}</DevRoot>
      </StrictMode>,
    );
  } else {
    /**
     * Landing (entry):
     */
    const { Landing, App, Content } = await import('../ui/ui.Landing-3/mod.ts');
    const app = App.signals();

    app.stack.push(await Content.Factory.entry());
    await App.Render.preloadModule(
      app,
      (id, options = {}) => Content.factory(id, { ...options, muted: true }),
      ['Entry', 'Trailer', 'Overview', 'Programme'],
    );
    void WarmVideo.landing();

    root.render(
      <StrictMode>
        <Root state={app}>
          <Landing state={app} style={{ Absolute: 0 }} />
        </Root>
      </StrictMode>,
    );
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
