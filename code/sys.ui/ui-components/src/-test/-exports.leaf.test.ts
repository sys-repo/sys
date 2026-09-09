import { describe, expect, it } from '../-test.ts';

type LeafContract = {
  readonly path: string;
  readonly names: readonly string[];
};

/**
 * Canonical React leaf contracts, grouped by their role in the public API.
 *
 * Tests below import package specifiers only. Implementation paths are
 * deliberately absent so this file proves the consumer-facing boundary.
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

describe('@sys/ui-components package exports', () => {
  describe('root boundaries', () => {
    it('keeps runtime roots minimal and package-only', async () => {
      const [root, react] = await Promise.all([
        import('@sys/ui-components'),
        import('@sys/ui-components/react'),
      ]);

      expect(Object.keys(root)).to.eql(['pkg']);
      expect(Object.keys(react)).to.eql(['pkg']);
      expect(root.pkg).to.equal(react.pkg);
    });

    it('keeps both type entrypoints runtime-empty', async () => {
      const [t, types] = await Promise.all([
        import('@sys/ui-components/t'),
        import('@sys/ui-components/types'),
      ]);

      expect(Object.keys(t)).to.eql([]);
      expect(Object.keys(types)).to.eql([]);
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

  describe('legacy compatibility aliases', () => {
    it('maps every non-React alias to its canonical React leaf', async () => {
      await Promise.all([
        expectLegacyAliases(leaves.primitives),
        expectLegacyAliases(leaves.content),
        expectLegacyAliases(leaves.layout),
        expectLegacyAliases(leaves.media),
      ]);
    });
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

async function expectLegacyAliases(contracts: readonly LeafContract[]) {
  await Promise.all(
    contracts.map(async (e) => {
      const legacySpecifier = `@sys/ui-components/${e.path}`;
      const canonicalSpecifier = `@sys/ui-components/react/${e.path}`;
      const [legacy, canonical] = await Promise.all([
        import(legacySpecifier),
        import(canonicalSpecifier),
      ]);

      e.names.forEach((name) => {
        expect(legacy[name], `${legacySpecifier} export: ${name}`).to.equal(canonical[name]);
      });
    }),
  );
}

async function expectExports(specifier: string, names: readonly string[]) {
  const m = await import(specifier);
  expect(Object.keys(m), specifier).to.include.members([...names]);
}
