import type { PluginContext, ResolvedId } from 'rollup';
import { describe, expect, it } from '../../-test.ts';
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
        async resolveViteSpecifier() {
          return undefined;
        },
      });

      const res = await plugin.resolveId.call(
        wrangle.context(async (id: string): Promise<ResolvedId | null> => {
          expect(id).to.eql('tinycolor2');
          return {
            id: '/virtual/tinycolor2/esm/tinycolor.js',
            external: false,
            resolvedBy: 'test',
            attributes: {},
            meta: {},
            moduleSideEffects: true,
            syntheticNamedExports: false,
          };
        }),
        'npm:tinycolor2@1.6.0',
      );

      expect(res).to.eql({
        id: '/virtual/tinycolor2/esm/tinycolor.js',
        external: false,
        resolvedBy: 'test',
        attributes: {},
        meta: {},
        moduleSideEffects: true,
        syntheticNamedExports: false,
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
      );

      expect(res).to.eql('@noble/hashes/legacy.js');
    });

    it('delegates http imports to resolveViteSpecifier', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
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
      );

      expect(res).to.eql('https://example.com/mod.ts?resolved');
    });

    it('ignores unrelated specifiers', async () => {
      const plugin = prefixPlugin(new Map(), {
        async resolveDeno() {
          return null;
        },
        async resolveViteSpecifier() {
          return undefined;
        },
      });

      const res = await plugin.resolveId.call(wrangle.context(async () => null), './local.ts');
      expect(res).to.eql(undefined);
    });
  });
});

const wrangle = {
  context(resolve: PluginContext['resolve']) {
    return { resolve } as PluginContext;
  },
} as const;
