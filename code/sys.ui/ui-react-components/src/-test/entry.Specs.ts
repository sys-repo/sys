/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.ui.react.component';

/**
 * Components:
 */
export const SpecsComponents = {
  [`${ns}: Bullet`]: () => import('../ui/Bullet/-SPEC.tsx'),
  [`${ns}: Button`]: () => import('../ui/Button/-SPEC.tsx'),
  [`${ns}: Cropmarks`]: () => import('../ui/Cropmarks/-SPEC.tsx'),
  [`${ns}: Icon`]: () => import('../ui/Icon/-SPEC.tsx'),
  [`${ns}: IFrame`]: () => import('../ui/IFrame/-SPEC.tsx'),
  [`${ns}: Image.Svg`]: () => import('../ui/Image.Svg/-SPEC.tsx'),
  [`${ns}: ObjectView`]: () => import('../ui/ObjectView/-SPEC.tsx'),
  [`${ns}: Layout.CenterColumn`]: () => import('../ui/Layout.CenterColumn/-SPEC.tsx'),
  [`${ns}: Panel`]: () => import('../ui/Panel/-SPEC.tsx'),
  [`${ns}: Preload`]: () => import('../ui/Preload/-SPEC.tsx'),
  [`${ns}: Sheet`]: () => import('../ui/Sheet/-SPEC.tsx'),
  [`${ns}: Spinners.Bar`]: () => import('../ui/Spinners.Bar/-SPEC.tsx'),
  [`${ns}: FadeElement`]: () => import('../ui/FadeElement/-SPEC.tsx'),

  [`${ns}.media: Media.Recorder`]: () => import('../ui/Media.Recorder/-spec/-SPEC.tsx'),
  [`${ns}.media: Player.Video`]: () => import('../ui/Player.Video/-SPEC.tsx'),
  [`${ns}.media: Player.Thumbnails`]: () => import('../ui/Player.Thumbnails/-SPEC.tsx'),
  [`${ns}.media: VimeoBackground`]: () => import('../ui/VimeoBackground/-SPEC.tsx'),
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
