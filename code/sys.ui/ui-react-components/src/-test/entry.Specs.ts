/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
const ns = 'sys.ui.react.component';

/**
 * Components:
 */
export const SpecsComponents = {
  [`${ns}: Button`]: () => import('../ui/Button/-SPEC.tsx'),
  [`${ns}: Cropmarks`]: () => import('../ui/Cropmarks/-SPEC.tsx'),
  [`${ns}: Icon`]: () => import('../ui/Icon/-SPEC.tsx'),
  [`${ns}: IFrame`]: () => import('../ui/IFrame/-SPEC.tsx'),
  [`${ns}: Image.Svg`]: () => import('../ui/Image.Svg/-SPEC.tsx'),
  [`${ns}: ObjectView`]: () => import('../ui/ObjectView/-SPEC.tsx'),
  [`${ns}: Panel`]: () => import('../ui/Panel/-SPEC.tsx'),
  [`${ns}: Preload`]: () => import('../ui/Preload/-SPEC.tsx'),
  [`${ns}: Sheet`]: () => import('../ui/Sheet/-SPEC.tsx'),

  [`${ns}: Player.Video`]: () => import('../ui/Player.Video/-SPEC.tsx'),
  [`${ns}: Player.Concept`]: () => import('../ui/Player.Concept/-SPEC.tsx'),
  [`${ns}: Player.Thumbnails`]: () => import('../ui/Player.Thumbnails/-SPEC.tsx'),
  [`${ns}: VimeoBackground`]: () => import('../ui/VimeoBackground/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Samples from external libs:
 */
export const SpecsExternal = {
  'sys.ui.css: @container': () => import('../-sample/-css-container/-SPEC.tsx'),
  'sys.ui.react: useMouse': () => import('../-sample/-dom-useMouse/-SPEC.tsx'),
  'sys.ui.react: useSizeObserver': () => import('../-sample/-dom-useSizeObserver/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Specs
 */
export const Specs = { ...SpecsComponents, ...SpecsExternal } as t.SpecImports;
