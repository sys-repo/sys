/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'sys.ui.component';

/**
 * Components:
 */
export const SpecsComponents = {
  [`${ns}: ObjectView`]: () => import('../ui/ObjectView/-SPEC.tsx'),

  [`${ns}: Button`]: () => import('../ui/Button/-SPEC.tsx'),
  [`${ns}: Buttons.Switch`]: () => import('../ui/Buttons.Switch/-spec/-SPEC.tsx'),
  [`${ns}: Buttons.Icons`]: () => import('../ui/Buttons.Icons/-spec/-SPEC.tsx'),

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
  [`${ns}: PropsGrid`]: () => import('../ui/PropsGrid/-spec/-SPEC.tsx'),
  [`${ns}: TextInput`]: () => import('../ui/Text.Input/-spec/-SPEC.tsx'),

  [`${ns}.player: Video.VidStack`]: () => import('../ui/Player.Video.Vidstack/-spec/-SPEC.tsx'),
  [`${ns}.player: Video.Element`]: () => import('../ui/Player.Video.Element/-spec/-SPEC.tsx'),
  [`${ns}:player: Video.Controls`]: () => import('../ui/Player.Video.Controls/-spec/-SPEC.tsx'),
  [`${ns}.player: Thumbnails`]: () => import('../ui/Player.Thumbnails/-SPEC.tsx'),
  [`${ns}.player: VimeoBackground`]: () => import('../ui/VimeoBackground/-SPEC.tsx'),

  [`${ns}.media: Recorder`]: () => import('../ui/Media.Recorder/-spec/-SPEC.tsx'),
  [`${ns}.media: Video (Stream)`]: () => import('../ui/Media.Video/-spec/-SPEC.tsx'),
  [`${ns}.media: Devices`]: () => import('../ui/Media.Devices/-spec/-SPEC.tsx'),
  [`${ns}.media: AudioWaveform`]: () => import('../ui/Media.AudioWaveform/-spec/-SPEC.tsx'),
  [`${ns}.media: Config.Filters`]: () => import('../ui/Media.Config/-spec.filters/-SPEC.tsx'),
  [`${ns}.media: Config.Zoom`]: () => import('../ui/Media.Config/-spec.zoom/-SPEC.tsx'),
  [`${ns}.media: Config.Slider`]: () => import('../ui/Media.Config/-spec.slider/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Samples from external libs:
 */
export const SpecsExternal = {
  'sys.ui.css: @container': () => import('../-sample/-css-container/-SPEC.tsx'),
  'sys.ui.react: usePointer': () => import('../-sample/-dom-usePointer/-SPEC.tsx'),
  'sys.ui.react: useSizeObserver': () => import('../-sample/-dom-useSizeObserver/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Specs
 */
export const Specs = { ...SpecsComponents, ...SpecsExternal } as t.SpecImports;
