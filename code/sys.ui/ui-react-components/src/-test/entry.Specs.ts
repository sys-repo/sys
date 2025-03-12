/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';

export const Specs = {
  'sys.ui.react.component.Panel': () => import('../ui/Panel/-SPEC.tsx'),
  'sys.ui.react.component.Player.Video': () => import('../ui/Player.Video/-SPEC.tsx'),
  'sys.ui.react.component.Player.Concept': () => import('../ui/Player.Concept/-SPEC.tsx'),
  'sys.ui.react.component.Player.Thumbnails': () => import('../ui/Player.Thumbnails/-SPEC.tsx'),
} as t.SpecImports;
