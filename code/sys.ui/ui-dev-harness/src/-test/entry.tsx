import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { pkg } from '../pkg.ts';

console.info('Pkg', pkg);
globalThis.document.title = `${pkg.name}@${pkg.version}`;

import('@sys/driver-vite/testing/sample-imports');

export async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');

  /**
   * Sample entry logic.
   */
  const rootElement = document.getElementById('root');
  const root = createRoot(rootElement);

  if (isDev) {
    /**
     * NOTE:
     *    The import of the [Dev] module happens dynamically here AFTER
     *    the URL query-string has been interpreted.  This allows the base
     *    module entry to by code-split in such a way that the [Dev Harness]
     *    never gets sent in the normal useage payload.
     */
    const { render } = await import('../mod.ts');
    const { ModuleSpecs, SampleSpecs } = await import('./entry.Specs.ts');
    const Specs = {
      ...SampleSpecs,
      ...ModuleSpecs,
    };
    const el = await render(Pkg, Specs, { hrDepth: 2, style: { Absolute: 0 } });
    root.render(<StrictMode>{el}</StrictMode>);
  } else {
    const { MySample } = await import('./sample.specs/MySample.tsx');
    const el = <MySample style={{ Absolute: 0 }} />;
    root.render(<StrictMode>{el}</StrictMode>);
  }
}

main().catch((err) => console.error(`Failed to render`, err));
