import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { pkg } from '../pkg.ts';

console.info('Pkg', pkg);
globalThis.document.title = `${pkg.name}@${pkg.version}`;

import '@sys/driver-vite/sample-imports';

export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');

  /**
   * Sample entry logic.
   */
  const root = createRoot(document.getElementById('root')!);

  if (isDev) {
    /**
     * NOTE:
     *    The import of the [Dev] module happens dynamically here AFTER
     *    the URL query-string has been interpreted.  This allows the base
     *    module entry to be code-split in such a way that the [Dev Harness]
     *    never gets sent in the normal usage payload.
     */
    const { render, useKeyboard } = await import('../mod.ts');
    const { ModuleSpecs, SampleSpecs } = await import('./entry.Specs.ts');

    // Dynamic "runnable specifications" Library:
    const Specs = {
      ...SampleSpecs,
      ...ModuleSpecs,
    };

    const el = await render(pkg, Specs, {
      hr: (e) => e.byRoots(['dev.', 'sys.ui']),
      style: { Absolute: 0 },
    });
    function App() {
      // NB: Any other environment setup here.
      useKeyboard();
      return el;
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } else {
    const { MySample } = await import('./sample.specs/MySample.tsx');
    const el = <MySample style={{ Absolute: 0 }} />;
    root.render(<StrictMode>{el}</StrictMode>);
  }
}

main().catch((err) => console.error(`Failed to render DevHarness`, err));
