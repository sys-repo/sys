/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
const ns = 'sys.ui.react.component';

export const SpecsComponents = {
  [`${ns}.Button`]: () => import('../ui/Button/-SPEC.tsx'),
  [`${ns}.Panel`]: () => import('../ui/Panel/-SPEC.tsx'),
  [`${ns}.Icon`]: () => import('../ui/Icon/-SPEC.tsx'),
  [`${ns}.IFrame`]: () => import('../ui/IFrame/-SPEC.tsx'),
  [`${ns}.Image.Svg`]: () => import('../ui/Image.Svg/-SPEC.tsx'),

  [`${ns}.Player.Video`]: () => import('../ui/Player.Video/-SPEC.tsx'),
  [`${ns}.Player.Concept`]: () => import('../ui/Player.Concept/-SPEC.tsx'),
  [`${ns}.Player.Thumbnails`]: () => import('../ui/Player.Thumbnails/-SPEC.tsx'),
  [`${ns}.VimeoBackground`]: () => import('../ui/VimeoBackground/-SPEC.tsx'),
} as t.SpecImports;

export const SpecsSamples = {
  '-sample.css-@container': () => import('../-sample/-m.css-container-type/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Specs
 */
export const Specs = { ...SpecsComponents, ...SpecsSamples } as t.SpecImports;
