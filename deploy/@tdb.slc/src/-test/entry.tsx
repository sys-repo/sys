import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../common.ts';

/**
 * Render UI.
 */
globalThis.document.title = pkg.name;
console.info('🐷 ./entry.tsx → Pkg:💦', pkg);

export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');
  const root = createRoot(document.getElementById('root')!);

  if (isDev) {
    /**
     * DevHarness:
     */
    const { render } = await import('@sys/ui-react-devharness');
    const { Specs } = await import('./entry.Specs.ts');
    const el = await render(pkg, Specs, { hrDepth: 3, style: { Absolute: 0 } });
    root.render(<StrictMode>{el}</StrictMode>);
  } else {
    /**
     * Landing (entry):
     */
    const { Landing, App } = await import('../ui/ui.Landing-3/mod.ts');
    const state = App.signals();
    state.load(await App.Content.find('Entry'));

    root.render(
      <StrictMode>
        <Landing state={state} style={{ Absolute: 0 }} />
      </StrictMode>,
    );
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
