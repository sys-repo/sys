/**
 * @module
 * Core DevHarness rendering library.
 *
 * @example
 * To run the DevHarness samples:
 * ```ts
 * deno task dev
 * ```
 *
 * @example
 * The DevHarness provides a visual layout for a functional BDD
 * spec that is specialised for rendering a `Subject` component and
 * then manipulating it's state based on buttons and other controls
 * in a right hande "debug" panel.
 *
 * ```ts
 * import { render } from '@sys/ui-dev-harness'
 * import { createRoot } from 'react-dom/client';
 * import { SampleSpecs } from './src/-test/entry.Specs.ts';
 *
 * const root = createRoot(document.getElementById('root')!);
 * const el = await render(Pkg, Specs, { hrDepth: 2 });
 * root.render(el);
 * ```
 *
 * or to render from the component directly:
 *
 * ```ts
 * import { Dev } from '@sys/ui-dev-harness'
 * import { SampleSpecs } from './src/-test/entry.Specs.ts';
 *
 * const el = <Dev.Harness specs={SampleSpecs} />
 * ```
 *
 * See `src/-test/sample.specs/` for example of the BDD specs.
 */
export { Dev, render } from './m.Dev/mod.ts';
export { pkg } from './pkg.ts';
export { Spec } from './u/Spec/mod.ts';

export { useRubberband } from './ui.use/useRubberband.ts';
export { ModuleList } from './ui/ModuleList/mod.ts';
