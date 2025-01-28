import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pkg } from '../common.ts';

/**
 * Render UI.
 */
globalThis.document.title = pkg.name;
console.info('Pkg', pkg);

/**
 * Main Entry.
 */
async function main() {
  const params = new URL(location.href).searchParams;
  const isDev = params.has('dev') || params.has('d');

  console.log('isDev', isDev);

  const { render } = await import('@sys/ui-react-devharness');
  const { Specs } = await import('./entry.Specs.ts');

  const el = await render(pkg, Specs, { hrDepth: 2, style: { Absolute: 0 } });
  const root = document.getElementById('root');
  createRoot(root).render(<StrictMode>{el}</StrictMode>);
}

/**
 * Run.
 */
main().catch((err) => console.error(`Failed to render`, err));
