import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BADGES } from '../common.ts';
import { pkg } from '../pkg.ts';
import { Dev } from '../ui.dev/mod.ts';

(async () => {
  console.info(`pkg:`, pkg);
  const badge = BADGES.ci.jsr;
  const { Specs } = await import('./entry.Specs.ts');

  const el = await Dev.render(pkg, Specs, { badge, hrDepth: 3 });
  const root = createRoot(document.getElementById('root')!);
  root.render(<StrictMode>{el}</StrictMode>);
})();
