import { describe, expect, it } from '../../-test.ts';
import type { t } from '../common.ts';
import prefixPlugin from '../u.prefix.ts';

describe('ViteTransport.prefix', () => {
  describe('plugin shape', () => {
    it('declares the pre-resolve deno prefix plugin', () => {
      const plugin = prefixPlugin(new Map());
      expect(plugin.name).to.eql('deno:prefix');
      expect(plugin.enforce).to.eql('pre');
    });
  });

  describe('specifier delegation', () => {
    it('strips npm versions and delegates to vite resolution', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return {
            id: 'react@19.2.0',
            kind: 'npm',
            loader: null,
            dependencies: [],
          };
        },
        async resolveNpmPath() {
          return null;
        },
        async resolveViteSpecifier() {
          return undefined;
        },
      });

      const res = await plugin.resolveId.call(
        wrangle.context(async (id: string) => {
          expect(id).to.eql('react');
          return null;
        }),
        'npm:react@19.2.0',
        undefined,
        wrangle.options(),
      );

      expect(res).to.eql('react');
    });

    it('prefers vite resolution for dual-package npm imports', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return {
            id: 'tinycolor2@1.6.0',
            kind: 'npm',
            loader: null,
            dependencies: [],
          };
        },
        async resolveNpmPath() {
          throw new Error('resolveNpmPath should not be used when vite resolves first');
        },
        async resolveViteSpecifier() {
          return undefined;
        },
      });

      const res = await plugin.resolveId.call(
        wrangle.context(async (id: string): Promise<t.Rollup.ResolvedId | null> => {
          expect(id).to.eql('tinycolor2');
          return {
            id: '/virtual/tinycolor2/esm/tinycolor.js',
            external: false,
            meta: {},
            moduleSideEffects: true,
          };
        }),
        'npm:tinycolor2@1.6.0',
        undefined,
        wrangle.options(),
      );

      expect(res).to.eql({
        id: '/virtual/tinycolor2/esm/tinycolor.js',
        external: false,
        meta: {},
        moduleSideEffects: true,
      });
    });

    it('preserves scoped npm subpaths when stripping versions', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return {
            id: '@noble/hashes@2.0.1/legacy.js',
            kind: 'npm',
            loader: null,
            dependencies: [],
          };
        },
        async resolveNpmPath() {
          return null;
        },
        async resolveViteSpecifier() {
          return undefined;
        },
      });

      const res = await plugin.resolveId.call(
        wrangle.context(async (id: string) => {
          expect(id).to.eql('@noble/hashes/legacy.js');
          return null;
        }),
        'npm:@noble/hashes@2.0.1/legacy.js',
        undefined,
        wrangle.options(),
      );

      expect(res).to.eql('@noble/hashes/legacy.js');
    });

    it('preserves npm subpaths even when deno info reports only the package root', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return {
            id: '@noble/hashes@2.0.1',
            kind: 'npm',
            loader: null,
            dependencies: [],
          };
        },
        async resolveNpmPath() {
          return null;
        },
        async resolveViteSpecifier() {
          return undefined;
        },
      });

      const res = await plugin.resolveId.call(
        wrangle.context(async (id: string) => {
          expect(id).to.eql('@noble/hashes/legacy.js');
          return null;
        }),
        'npm:@noble/hashes@2.0.1/legacy.js',
        undefined,
        wrangle.options(),
      );

      expect(res).to.eql('@noble/hashes/legacy.js');
    });

    it('delegates http imports to resolveViteSpecifier', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return null;
        },
        async resolveNpmPath() {
          return null;
        },
        async resolveViteSpecifier(id) {
          return `${id}?resolved`;
        },
      });

      const res = await plugin.resolveId.call(
        wrangle.context(async () => null),
        'https://example.com/mod.ts',
        '/tmp/importer.ts',
        wrangle.options(),
      );

      expect(res).to.eql('https://example.com/mod.ts?resolved');
    });

    it('ignores unrelated specifiers', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return null;
        },
        async resolveNpmPath() {
          return null;
        },
        async resolveViteSpecifier() {
          return undefined;
        },
      });

      const res = await plugin.resolveId.call(
        wrangle.context(async () => null),
        './local.ts',
        undefined,
        wrangle.options(),
      );
      expect(res).to.eql(undefined);
    });

    it('falls back to a deno-resolved npm file path when vite resolution fails', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return {
            id: 'react@19.2.4',
            kind: 'npm',
            loader: null,
            dependencies: [],
          };
        },
        async resolveNpmPath(id, cwd) {
          expect(id).to.eql('react');
          expect(cwd).to.eql('/tmp/project');
          return '/tmp/project/node_modules/.deno/react@19.2.4/node_modules/react/index.js';
        },
        async resolveViteSpecifier() {
          return undefined;
        },
      });
      plugin.configResolved?.call({} as t.Rollup.PluginContext, { root: '/tmp/project' });

      const res = await plugin.resolveId.call(
        wrangle.context(async (id: string) => {
          expect(id).to.eql('react');
          return null;
        }),
        'npm:react@19.2.4',
        undefined,
        wrangle.options(),
      );

      expect(res).to.eql('/tmp/project/node_modules/.deno/react@19.2.4/node_modules/react/index.js');
    });
  });
});

const wrangle = {
  context(resolve: t.Rollup.PluginContext['resolve']) {
    return {
      resolve,
      meta: { rolldownVersion: 'test', viteVersion: 'test' },
      cache: new Map(),
      getWatchFiles: () => [],
      setAssetSource: () => {
        throw new Error('not implemented in test');
      },
    } as unknown as t.Rollup.PluginContext;
  },
  options() {
    return { isEntry: false } as const;
  },
} as const;
