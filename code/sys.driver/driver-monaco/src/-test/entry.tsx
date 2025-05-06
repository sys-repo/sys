import React from 'react';
import { createRoot } from 'react-dom/client';

import type { t } from '../common.ts';
import { pkg } from '../pkg.ts';

/**
 * Render UI.
 */
const document = globalThis.document;
if (document) {
  document.title = pkg.name;
  document.body.style.overflow = 'hidden'; // NB: suppress rubber-band effect.
}

/**
 * Setup mounter:
 */
const Root = (props: { children?: t.ReactNode }) => {
  return props.children;
};

/**
 * MAIN entry.
 */
export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');
  const root = createRoot(document.getElementById('root')!);

  /**
   * DevHarness:
   */
  const { render } = await import('@sys/ui-react-devharness');
  const { Specs } = await import('./entry.Specs.ts');
  const el = await render(pkg, Specs, { hrDepth: 3, keyboard: true, style: { Absolute: 0 } });

  root.render(
    <React.StrictMode>
      <Root>{el}</Root>
    </React.StrictMode>,
  );
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
