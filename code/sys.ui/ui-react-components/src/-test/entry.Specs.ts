/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';

export const Specs = {
  'sys.ui.react.component.Foo': () => import('../ui/Foo/-SPEC.tsx'),
} as t.SpecImports;
