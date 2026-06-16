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
  [`${ns}: ActionProbe`]: () => import('../ui.react/ActionProbe/-spec/-SPEC.tsx'),

  [`${ns}: Button`]: () => import('../ui.react/Button/-spec/-SPEC.tsx'),
  [`${ns}: Buttons.Switch`]: () => import('../ui.react/Buttons.Switch/-spec/-SPEC.tsx'),
  [`${ns}: Buttons.Icons`]: () => import('../ui.react/Buttons.Icons/-spec/-SPEC.tsx'),

  [`${ns}: Anchor`]: () => import('../ui.react/Anchor/-spec/-SPEC.tsx'),
  [`${ns}: KeyValue`]: () => import('../ui.react/KeyValue/-spec/-SPEC.tsx'),
  [`${ns}: KeyValue.Switches`]: () => import('../ui.react/KeyValue.Switches/-spec/-SPEC.tsx'),
  [`${ns}: ObjectView`]: () => import('../ui.react/ObjectView/-SPEC.tsx'),

  [`${ns}: Bullet`]: () => import('../ui.react/Bullet/-SPEC.tsx'),
  [`${ns}: BulletList`]: () => import('../ui.react/BulletList/-spec/-SPEC.tsx'),
  [`${ns}: Cropmarks`]: () => import('../ui.react/Cropmarks/-spec/-SPEC.tsx'),
  [`${ns}: ErrorBoundary`]: () => import('../ui.react/ErrorBoundary/-spec/-SPEC.tsx'),
  [`${ns}: FadeElement`]: () => import('../ui.react/FadeElement/-SPEC.tsx'),
  [`${ns}: Icon`]: () => import('../ui.react/Icon/-spec/-SPEC.tsx'),
  [`${ns}: Icon.Swatches`]: () => import('../ui.react/Icon.Swatches/-spec/-SPEC.tsx'),
  [`${ns}: IFrame`]: () => import('../ui.react/IFrame/-SPEC.tsx'),
  [`${ns}: Image.Svg`]: () => import('../ui.react/Image.Svg/-SPEC.tsx'),
  [`${ns}: PathView`]: () => import('../ui.react/PathView/-spec/-SPEC.tsx'),
  [`${ns}: Preload`]: () => import('../ui.react/Preload/-SPEC.tsx'),
  [`${ns}: Sheet`]: () => import('../ui.react/Sheet/-spec/-SPEC.tsx'),
  [`${ns}: Slider`]: () => import('../ui.react/Slider/-spec/-SPEC.tsx'),
  [`${ns}: Spinners.Bar`]: () => import('../ui.react/Spinners.Bar/-SPEC.tsx'),
  [`${ns}: Splash`]: () => import('../ui.react/Splash/-spec/-SPEC.tsx'),

  [`${ns}: Text.Input`]: () => import('../ui.react/Text.Input/-spec/-SPEC.tsx'),
  [`${ns}: Text.Ellipsize`]: () => import('../ui.react/Text.Ellipsize/-spec/-SPEC.tsx'),

  [`${ns}: Prose.Measure`]: () => import('../ui.react/Prose.Measure/-spec/-SPEC.tsx'),
  [`${ns}: Prose.Manuscript`]: () => import('../ui.react/Prose.Manuscript/-spec/-SPEC.tsx'),
  [`${ns}: Prose.Markdown`]: () => import('../ui.react/Prose.Markdown/-spec/-SPEC.tsx'),

  [`${ns}: Layout.CenterColumn`]: () => import('../ui.react/Layout.CenterColumn/-spec/-SPEC.tsx'),
  [`${ns}: Layout.RectGrid`]: () => import('../ui.react/Layout.RectGrid/-spec/-SPEC.tsx'),
  [`${ns}: Layout.SplitPane`]: () => import('../ui.react/Layout.SplitPane/-spec/-SPEC.tsx'),
  [`${ns}: Layout.Tabs`]: () => import('../ui.react/Layout.Tabs/-spec/-SPEC.tsx'),
  [`${ns}: Layout.TreeHost`]: () => import('../ui.react/Layout.TreeHost/-spec/-SPEC.tsx'),

  [`${ns}: Http.Origin`]: () => import('../ui.react/Http.Origin/-spec/-SPEC.tsx'),

  [`${ns}: TreeView.Index`]: () => import('../ui.react/TreeView.Index/-spec/-SPEC.tsx'),
  [`${ns}: TreeView.Index.Item`]: () => import('../ui.react/TreeView.Index.Item/-spec/-SPEC.tsx'),

  [`${ns}: Player.Video: Element`]: () =>
    import('../ui.react/Player.Video.Element/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: Controls`]: () =>
    import('../ui.react/Player.Video.Controls/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: Decks`]: () => import('../ui.react/Player.Video.Decks/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: VimeoBackground`]: () => import('../ui.react/VimeoBackground/-SPEC.tsx'),
  [`${ns}: Player.YouTube`]: () => import('../ui.react/Player.YouTube/-spec/-SPEC.tsx'),

  [`${ns}.media: Recorder`]: () => import('../ui.react/Media.Recorder/-spec/-SPEC.tsx'),
  [`${ns}.media: Timecode.PlaybackDriver`]: () =>
    import('../ui.react/Media.Timecode.PlaybackDriver/-spec/-SPEC.tsx'),
  [`${ns}.media: Video (Stream)`]: () => import('../ui.react/Media.Video/-spec/-SPEC.tsx'),
  [`${ns}.media: Devices`]: () => import('../ui.react/Media.Devices/-spec/-SPEC.tsx'),
  [`${ns}.media: AudioWaveform`]: () => import('../ui.react/Media.AudioWaveform/-spec/-SPEC.tsx'),
  [`${ns}.media: Config.Filters`]: () => import('../ui.react/Media.Config/-spec.filters/-SPEC.tsx'),
  [`${ns}.media: Config.Zoom`]: () => import('../ui.react/Media.Config/-spec.zoom/-SPEC.tsx'),
  [`${ns}.media: Config.Slider`]: () => import('../ui.react/Media.Config/-spec.slider/-SPEC.tsx'),

  [`${ns}: Dist`]: () => import('../ui.react/Dist/-spec/-SPEC.tsx'),
  [`${ns}: Dist.Browser`]: () => import('../ui.react/Dist/-spec.browser/-SPEC.tsx'),
  [`${ns}: Ownership`]: () => import('../ui.react/Ownership/-spec/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Samples from external libs:
 */
export const SpecsExternal = {
  'sys.ui: WebFonts': () => import('../m.webfonts/-spec/-SPEC.tsx'),
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
