/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';

export const Specs = {
  'sys.ui.react.component.Foo': () => import('../ui/Foo/-SPEC.tsx'),
  'sys.ui.react.component.Player.Video': () => import('../ui/Player.Video/-SPEC.tsx'),
} as t.SpecImports;
