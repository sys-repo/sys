/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
/** DevHarness namespace prefix for component specs. */
export const ns = 'sys.ui.component';

/**
 * Components:
 */
export const SpecsComponents = {
  [`${ns}: ActionProbe`]: () => import('../ui.react/ui/ActionProbe/-spec/-SPEC.tsx'),

  [`${ns}: Button`]: () => import('../ui.react/ui/Button/-spec/-SPEC.tsx'),
  [`${ns}: Buttons.Switch`]: () => import('../ui.react/ui/Buttons.Switch/-spec/-SPEC.tsx'),
  [`${ns}: Buttons.Icons`]: () => import('../ui.react/ui/Buttons.Icons/-spec/-SPEC.tsx'),

  [`${ns}: Anchor`]: () => import('../ui.react/ui/Anchor/-spec/-SPEC.tsx'),
  [`${ns}: Chip`]: () => import('../ui.react/ui/Chip/-spec/-SPEC.tsx'),
  [`${ns}: KeyValue`]: () => import('../ui.react/ui/KeyValue/-spec/-SPEC.tsx'),
  [`${ns}: KeyValue.Switches`]: () => import('../ui.react/ui/KeyValue.Switches/-spec/-SPEC.tsx'),
  [`${ns}: ObjectView`]: () => import('../ui.react/ui/ObjectView/-SPEC.tsx'),

  [`${ns}: Bullet`]: () => import('../ui.react/ui/Bullet/-SPEC.tsx'),
  [`${ns}: BulletList`]: () => import('../ui.react/ui/BulletList/-spec/-SPEC.tsx'),
  [`${ns}: Cropmarks`]: () => import('../ui.react/ui/Cropmarks/-spec/-SPEC.tsx'),
  [`${ns}: ErrorBoundary`]: () => import('../ui.react/ui/ErrorBoundary/-spec/-SPEC.tsx'),
  [`${ns}: FadeElement`]: () => import('../ui.react/ui/FadeElement/-SPEC.tsx'),
  [`${ns}: Icon`]: () => import('../ui.react/ui/Icon/-spec/-SPEC.tsx'),
  [`${ns}: Icon.Swatches`]: () => import('../ui.react/ui/Icon.Swatches/-spec/-SPEC.tsx'),
  [`${ns}: IFrame`]: () => import('../ui.react/ui/IFrame/-SPEC.tsx'),
  [`${ns}: Image.Svg`]: () => import('../ui.react/ui/Image.Svg/-SPEC.tsx'),
  [`${ns}: PathView`]: () => import('../ui.react/ui/PathView/-spec/-SPEC.tsx'),
  [`${ns}: Preload`]: () => import('../ui.react/ui/Preload/-SPEC.tsx'),
  [`${ns}: Sheet`]: () => import('../ui.react/ui/Sheet/-spec/-SPEC.tsx'),
  [`${ns}: Slider`]: () => import('../ui.react/ui/Slider/-spec/-SPEC.tsx'),
  [`${ns}: Spinners.Bar`]: () => import('../ui.react/ui/Spinners.Bar/-SPEC.tsx'),
  [`${ns}: Splash`]: () => import('../ui.react/ui/Splash/-spec/-SPEC.tsx'),

  [`${ns}: Text.Input`]: () => import('../ui.react/ui/Text.Input/-spec/-SPEC.tsx'),
  [`${ns}: Text.Ellipsize`]: () => import('../ui.react/ui/Text.Ellipsize/-spec/-SPEC.tsx'),

  [`${ns}: Prose.Measure`]: () => import('../ui.react/ui/Prose.Measure/-spec/-SPEC.tsx'),
  [`${ns}: Prose.Manuscript`]: () => import('../ui.react/ui/Prose.Manuscript/-spec/-SPEC.tsx'),
  [`${ns}: Prose.Markdown`]: () => import('../ui.react/ui/Prose.Markdown/-spec/-SPEC.tsx'),

  [`${ns}: Layout.CenterColumn`]: () =>
    import('../ui.react/ui/Layout.CenterColumn/-spec/-SPEC.tsx'),
  [`${ns}: Layout.RectGrid`]: () => import('../ui.react/ui/Layout.RectGrid/-spec/-SPEC.tsx'),
  [`${ns}: Layout.SplitPane`]: () => import('../ui.react/ui/Layout.SplitPane/-spec/-SPEC.tsx'),
  [`${ns}: Layout.Tabs`]: () => import('../ui.react/ui/Layout.Tabs/-spec/-SPEC.tsx'),
  [`${ns}: Layout.TreeHost`]: () => import('../ui.react/ui/Layout.TreeHost/-spec/-SPEC.tsx'),

  [`${ns}: Http.Origin`]: () => import('../ui.react/ui/Http.Origin/-spec/-SPEC.tsx'),

  [`${ns}: TreeView.Index`]: () => import('../ui.react/ui/TreeView.Index/-spec/-SPEC.tsx'),
  [`${ns}: TreeView.Index.Item`]: () =>
    import('../ui.react/ui/TreeView.Index.Item/-spec/-SPEC.tsx'),

  [`${ns}: Player.Video: Element`]: () =>
    import('../ui.react/ui/Player.Video.Element/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: Controls`]: () =>
    import('../ui.react/ui/Player.Video.Controls/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: Decks`]: () => import('../ui.react/ui/Player.Video.Decks/-spec/-SPEC.tsx'),
  [`${ns}: Player.Video: VimeoBackground`]: () =>
    import('../ui.react/ui/VimeoBackground/-SPEC.tsx'),
  [`${ns}: Player.YouTube`]: () => import('../ui.react/ui/Player.YouTube/-spec/-SPEC.tsx'),

  [`${ns}.media: Recorder`]: () => import('../ui.react/ui/Media.Recorder/-spec/-SPEC.tsx'),
  [`${ns}.media: Timecode.PlaybackDriver`]: () =>
    import('../ui.react/ui/Media.Timecode.PlaybackDriver/-spec/-SPEC.tsx'),
  [`${ns}.media: Video (Stream)`]: () => import('../ui.react/ui/Media.Video/-spec/-SPEC.tsx'),
  [`${ns}.media: Devices`]: () => import('../ui.react/ui/Media.Devices/-spec/-SPEC.tsx'),
  [`${ns}.media: AudioWaveform`]: () =>
    import('../ui.react/ui/Media.AudioWaveform/-spec/-SPEC.tsx'),
  [`${ns}.media: Config.Filters`]: () =>
    import('../ui.react/ui/Media.Config/-spec.filters/-SPEC.tsx'),
  [`${ns}.media: Config.Zoom`]: () => import('../ui.react/ui/Media.Config/-spec.zoom/-SPEC.tsx'),
  [`${ns}.media: Config.Slider`]: () =>
    import('../ui.react/ui/Media.Config/-spec.slider/-SPEC.tsx'),

  [`${ns}: Dist`]: () => import('../ui.react/ui/Dist/-spec/-SPEC.tsx'),
  [`${ns}: Dist.Browser`]: () => import('../ui.react/ui/Dist/-spec.browser/-SPEC.tsx'),
  [`${ns}: Ownership`]: () => import('../ui.react/ui/Ownership/-spec/-SPEC.tsx'),

  [`${ns}: Dev.Help.Markdown`]: () => import('../ui.react/dev/m.Help.Markdown/-spec/-SPEC.tsx'),
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
