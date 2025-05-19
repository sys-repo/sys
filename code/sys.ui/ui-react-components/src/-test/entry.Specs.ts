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
  [`${ns}: Button`]: () => import('../ui/Button/-SPEC.tsx'),
  [`${ns}: ObjectView`]: () => import('../ui/ObjectView/-SPEC.tsx'),

  [`${ns}: Bullet`]: () => import('../ui/Bullet/-SPEC.tsx'),
  [`${ns}: Cropmarks`]: () => import('../ui/Cropmarks/-SPEC.tsx'),
  [`${ns}: Icon`]: () => import('../ui/Icon/-SPEC.tsx'),
  [`${ns}: IFrame`]: () => import('../ui/IFrame/-SPEC.tsx'),
  [`${ns}: Image.Svg`]: () => import('../ui/Image.Svg/-SPEC.tsx'),
  [`${ns}: Layout.CenterColumn`]: () => import('../ui/Layout.CenterColumn/-SPEC.tsx'),
  [`${ns}: Preload`]: () => import('../ui/Preload/-SPEC.tsx'),
  [`${ns}: Sheet`]: () => import('../ui/Sheet/-SPEC.tsx'),
  [`${ns}: Slider`]: () => import('../ui/Slider/-spec/-SPEC.tsx'),
  [`${ns}: Spinners.Bar`]: () => import('../ui/Spinners.Bar/-SPEC.tsx'),
  [`${ns}: FadeElement`]: () => import('../ui/FadeElement/-SPEC.tsx'),

  [`${ns}.player: Player.Video`]: () => import('../ui/Player.Video/-SPEC.tsx'),
  [`${ns}.player: Player.Thumbnails`]: () => import('../ui/Player.Thumbnails/-SPEC.tsx'),
  [`${ns}.player: VimeoBackground`]: () => import('../ui/VimeoBackground/-SPEC.tsx'),

  [`${ns}.io: Media.Recorder`]: () => import('../ui/Media.Recorder/-spec/-SPEC.tsx'),
  [`${ns}.io: Media.Devices`]: () => import('../ui/Media.Devices/-spec/-SPEC.tsx'),
  [`${ns}.io: Media.Video`]: () => import('../ui/Media.Video/-spec/-SPEC.tsx'),
  [`${ns}.io: Media.Zoom`]: () => import('../ui/Media.Zoom/-spec/-SPEC.tsx'),
  [`${ns}.io: Media.AudioWaveform`]: () => import('../ui/Media.AudioWaveform/-spec/-SPEC.tsx'),
  [`${ns}.io: Media.Video.Config`]: () => import('../ui/Media.Video.Config/-spec/-SPEC.tsx'),
  [`${ns}.io: Media.Video.Slider`]: () => import('../ui/Media.Video.Config/-spec.filter/-SPEC.tsx'),
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
