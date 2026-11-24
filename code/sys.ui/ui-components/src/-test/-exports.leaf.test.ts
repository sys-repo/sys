import { describe, expect, it } from '../-test.ts';
import { Obj } from '../common.ts';
import { FocusStyle } from '../m.style/m.FocusStyle/mod.ts';

type LeafContract = {
  readonly path: string;
  readonly names: readonly string[];
};

/**
 * Canonical React leaf contracts, grouped by their role in the public API.
 *
 * React leaf tests use package specifiers. The focus leaf also pins runtime
 * identity against its owning module.
 */
const leaves = {
  primitives: [
    { path: 'action-probe', names: ['ActionProbe'] },
    { path: 'anchor', names: ['A', 'Anchor'] },
    { path: 'bullet', names: ['Bullet'] },
    { path: 'bullet-list', names: ['BulletList'] },
    { path: 'button', names: ['Button'] },
    { path: 'buttons', names: ['Buttons'] },
    { path: 'buttons/icons', names: ['IconButtons'] },
    { path: 'buttons/switch', names: ['Switch', 'SwitchTheme'] },
    { path: 'chip', names: ['Chip'] },
    { path: 'cropmarks', names: ['Cropmarks'] },
    { path: 'error-boundary', names: ['ErrorBoundary'] },
    { path: 'fade-element', names: ['FadeElement'] },
    { path: 'icon', names: ['Icon'] },
    { path: 'icon-swatches', names: ['IconSwatches'] },
    { path: 'iframe', names: ['IFrame'] },
    { path: 'image/svg', names: ['Svg'] },
    { path: 'preload', names: ['Preload'] },
    { path: 'sheet', names: ['Sheet'] },
    { path: 'slider', names: ['Slider'] },
    { path: 'splash', names: ['Splash'] },
    { path: 'spinners', names: ['Spinners'] },
    { path: 'spinners/bar', names: ['BarSpinner'] },
    { path: 'spinners/circular', names: ['CircularSpinner'] },
    { path: 'text', names: ['Text'] },
  ],
  content: [
    { path: 'http-origin', names: ['HttpOrigin'] },
    { path: 'key-value', names: ['KeyValue'] },
    { path: 'object-view', names: ['ObjectView'] },
    { path: 'path-view', names: ['PathView'] },
    { path: 'prose', names: ['Prose'] },
    { path: 'tree-view', names: ['TreeView'] },
    { path: 'tree-view/index', names: ['IndexTreeView'] },
  ],
  layout: [
    { path: 'layout/center-column', names: ['CenterColumn'] },
    { path: 'layout/rect-grid', names: ['RectGrid'] },
    { path: 'layout/split-pane', names: ['SplitPane'] },
    { path: 'layout/tabs', names: ['Tabs'] },
    { path: 'layout/tree-host', names: ['TreeHost'] },
  ],
  media: [
    { path: 'media', names: ['Media'] },
    {
      path: 'media/recorder/dev',
      names: ['ExternalLink', 'RecorderHookView', 'StatefulDeviceList'],
    },
    {
      path: 'media/timecode/playback-driver',
      names: ['Dev', 'PlaybackDriver'],
    },
    { path: 'player', names: ['Player'] },
    { path: 'player/youtube', names: ['YouTube'] },
    { path: 'vimeo-background', names: ['VimeoBackground'] },
  ],
} as const satisfies Record<string, readonly LeafContract[]>;

// Pin the retired paths independently of the current export map.
const retiredReactPaths = [
  'action-probe',
  'anchor',
  'bullet',
  'bullet-list',
  'button',
  'buttons',
  'buttons/icons',
  'buttons/switch',
  'chip',
  'cropmarks',
  'error-boundary',
  'fade-element',
  'http-origin',
  'icon',
  'icon-swatches',
  'iframe',
  'image/svg',
  'key-value',
  'layout/center-column',
  'layout/rect-grid',
  'layout/split-pane',
  'layout/tabs',
  'layout/tree-host',
  'media',
  'media/recorder/dev',
  'media/timecode/playback-driver',
  'object-view',
  'path-view',
  'player',
  'player/youtube',
  'preload',
  'prose',
  'sheet',
  'slider',
  'splash',
  'spinners',
  'text',
  'tree-view',
  'tree-view/index',
  'vimeo-background',
] as const;

describe('@sys/ui-components package exports', () => {
  describe('root boundaries', () => {
    it('keeps runtime roots minimal and package-only', async () => {
      const [root, react] = await Promise.all([
        import('@sys/ui-components'),
        import('@sys/ui-components/react'),
      ]);

      expect(Obj.keys(root)).to.eql(['pkg']);
      expect(Obj.keys(react)).to.eql(['pkg']);
      expect(root.pkg).to.equal(react.pkg);
    });

    it('keeps the type entrypoint runtime-empty', async () => {
      const t = await import('@sys/ui-components/t');
      expect(Obj.keys(t)).to.eql([]);
    });
  });

  describe('canonical React leaves', () => {
    it('exports interaction and presentation primitives', async () => {
      await expectReactLeaves(leaves.primitives);
    });

    it('exports structured content and data views', async () => {
      await expectReactLeaves(leaves.content);
    });

    it('exports layout primitives', async () => {
      await expectReactLeaves(leaves.layout);
    });

    it('exports media and playback surfaces', async () => {
      await expectReactLeaves(leaves.media);
    });
  });

  describe('opt-in support leaves', () => {
    it('exports the shared focus owner through one intentional style leaf', async () => {
      const { FocusStyle: exported } = await import('@sys/ui-components/style/focus');
      expect(exported).to.equal(FocusStyle);
    });

    it('exports development composition and visual-spec surfaces', async () => {
      await Promise.all([
        expectExports('@sys/ui-components/react/dev', ['Dev']),
        expectExports('@sys/ui-components/specs', ['Specs']),
      ]);
    });

    it('exports web-font helpers outside the React component lane', async () => {
      await expectExports('@sys/ui-components/fonts', [
        'ETBook',
        'Fonts',
        'SourceSans3',
        'useFontBundle',
      ]);
    });
  });

  describe('unsupported short React paths', () => {
    for (const path of [...retiredReactPaths, 'spinners/bar', 'spinners/circular']) {
      it(`does not resolve /${path}`, () => {
        expect(() => import.meta.resolve(`@sys/ui-components/${path}`))
          .to.throw(TypeError, path);
      });
    }
  });
});

/**
 * Helpers
 */

async function expectReactLeaves(contracts: readonly LeafContract[]) {
  await Promise.all(
    contracts.map((e) => expectExports(`@sys/ui-components/react/${e.path}`, e.names)),
  );
}

async function expectExports(specifier: string, names: readonly string[]) {
  const m = await import(specifier);
  expect(Obj.keys(m), specifier).to.include.members([...names]);
}
