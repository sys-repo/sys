/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.ui.component';

/**
 * Components:
 */
export const SpecsComponents = {
  [`${ns}: Button`]: () => import('../ui/Button/-spec/-SPEC.tsx'),
  [`${ns}: Buttons.Switch`]: () => import('../ui/Buttons.Switch/-spec/-SPEC.tsx'),
  [`${ns}: Buttons.Icons`]: () => import('../ui/Buttons.Icons/-spec/-SPEC.tsx'),

  [`${ns}: Bullet`]: () => import('../ui/Bullet/-SPEC.tsx'),
  [`${ns}: Cropmarks`]: () => import('../ui/Cropmarks/-spec/-SPEC.tsx'),
  [`${ns}: ErrorBoundary`]: () => import('../ui/ErrorBoundary/-spec/-SPEC.tsx'),
  [`${ns}: FadeElement`]: () => import('../ui/FadeElement/-SPEC.tsx'),
  [`${ns}: Icon`]: () => import('../ui/Icon/-spec/-SPEC.tsx'),
  [`${ns}: Icon.Swatches`]: () => import('../ui/Icon.Swatches/-spec/-SPEC.tsx'),
  [`${ns}: IFrame`]: () => import('../ui/IFrame/-SPEC.tsx'),
  [`${ns}: Image.Svg`]: () => import('../ui/Image.Svg/-SPEC.tsx'),
  [`${ns}: KeyValue`]: () => import('../ui/KeyValue/-spec/-SPEC.tsx'),
  [`${ns}: ObjectView`]: () => import('../ui/ObjectView/-SPEC.tsx'),
  [`${ns}: PathView`]: () => import('../ui/PathView/-spec/-SPEC.tsx'),
  [`${ns}: Preload`]: () => import('../ui/Preload/-SPEC.tsx'),
  [`${ns}: Sheet`]: () => import('../ui/Sheet/-spec/-SPEC.tsx'),
  [`${ns}: Slider`]: () => import('../ui/Slider/-spec/-SPEC.tsx'),
  [`${ns}: Spinners.Bar`]: () => import('../ui/Spinners.Bar/-SPEC.tsx'),
  [`${ns}: TextInput`]: () => import('../ui/Text.Input/-spec/-SPEC.tsx'),

  [`${ns}: Layout.CenterColumn`]: () => import('../ui/Layout.CenterColumn/-spec/-SPEC.tsx'),
  [`${ns}: Layout.RectGrid`]: () => import('../ui/Layout.RectGrid/-spec/-SPEC.tsx'),
  [`${ns}: Layout.SplitPane`]: () => import('../ui/Layout.SplitPane/-spec/-SPEC.tsx'),

  [`${ns}: Tree.Index`]: () => import('../ui/Tree.Index/-spec/-SPEC.tsx'),
  [`${ns}: Tree.Index.Item`]: () => import('../ui/Tree.Index.Item/-spec/-SPEC.tsx'),

  [`${ns}: Player.Video: Element`]: () => import('../ui/Player.Video.Element/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: Controls`]: () => import('../ui/Player.Video.Controls/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: VimeoBackground`]: () => import('../ui/VimeoBackground/-SPEC.tsx'),
  [`${ns}: Player.YouTube`]: () => import('../ui/Player.YouTube/-spec/-SPEC.tsx'),

  [`${ns}.media: Recorder`]: () => import('../ui/Media.Recorder/-spec/-SPEC.tsx'),
  [`${ns}.media: Timecode.PlaybackDriver`]: () =>
    import('../ui/Media.Timecode.PlaybackDriver/-spec/-SPEC.tsx'),
  [`${ns}.media: Video (Stream)`]: () => import('../ui/Media.Video/-spec/-SPEC.tsx'),
  [`${ns}.media: Devices`]: () => import('../ui/Media.Devices/-spec/-SPEC.tsx'),
  [`${ns}.media: AudioWaveform`]: () => import('../ui/Media.AudioWaveform/-spec/-SPEC.tsx'),
  [`${ns}.media: Config.Filters`]: () => import('../ui/Media.Config/-spec.filters/-SPEC.tsx'),
  [`${ns}.media: Config.Zoom`]: () => import('../ui/Media.Config/-spec.zoom/-SPEC.tsx'),
  [`${ns}.media: Config.Slider`]: () => import('../ui/Media.Config/-spec.slider/-SPEC.tsx'),

  [`${ns}: Dist`]: () => import('../ui/Dist/-spec/-SPEC.tsx'),
  [`${ns}: Dist.Browser`]: () => import('../ui/Dist/-spec.browser/-SPEC.tsx'),
  [`${ns}: Ownership`]: () => import('../ui/Ownership/-spec/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Samples from external libs:
 */
export const SpecsExternal = {
  'sys.ui.css: @container': () => import('../-sample/-css-container/-SPEC.tsx'),
  'sys.ui.css: Scroll': () => import('../-sample/-css-Scroll/-spec/-SPEC.tsx'),
  'sys.ui.react: usePointer': () => import('../-sample/-dom-usePointer/-SPEC.tsx'),
  'sys.ui.react: useWebFont': () => import('../-sample/-css-useWebFont/-SPEC.tsx'),
  'sys.ui.react: useSizeObserver': () => import('../-sample/-dom-useSizeObserver/-SPEC.tsx'),
  'sys.std: Schedule': () => import('../-sample/-std-Schedule/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Specs
 */
export const Specs = { ...SpecsComponents, ...SpecsExternal } as t.SpecImports;
