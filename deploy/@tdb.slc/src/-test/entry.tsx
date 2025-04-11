import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import type { t } from '../common.ts';
import { pkg } from '../pkg.ts';
import { useKeyboard } from '../ui/use/use.Keyboard.ts';

/**
 * Render UI.
 */
const document = globalThis.document;
if (document) {
  document.title = pkg.name;
  document.body.style.overflow = 'hidden'; // NB: suppress rubber-band effect.
}

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
    const { render } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./entry.Specs.ts');

    const app = App.signals();
    const el = await render(pkg, Specs, { hrDepth: 3, style: { Absolute: 0 } });

    root.render(
      <StrictMode>
        <Root state={app}>{el}</Root>
      </StrictMode>,
    );
  } else {
    /**
     * Landing (entry):
     */
    const { Landing, App, Content } = await import('../ui/ui.Landing-3/mod.ts');
    const app = App.signals();
    app.stack.push(await Content.Factory.entry());
    // await App.Render.preload(Content.factory, 'Entry', 'Trailer');

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
