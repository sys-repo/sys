import { describe, expect, it } from '../../-test.ts';
import {
  createNpmPrewarm,
  createSpecifierRewrite,
  parseJsrSpecifier,
  parseNpmSpecifier,
  resolveFromImportsMap,
} from '../u.app.specifierRewrite.ts';

describe('ViteConfig.app specifier rewrite', () => {
  describe('parseNpmSpecifier', () => {
    it('parses scoped and unscoped npm specifiers', () => {
      expect(parseNpmSpecifier('npm:react@19.2.4')).to.eql('react');
      expect(parseNpmSpecifier('npm:react@19.2.4/jsx-runtime')).to.eql('react/jsx-runtime');
      expect(parseNpmSpecifier('npm:@scope/pkg@1.2.3')).to.eql('@scope/pkg');
      expect(parseNpmSpecifier('npm:@scope/pkg@1.2.3/sub/path')).to.eql('@scope/pkg/sub/path');
      expect(parseNpmSpecifier('npm:')).to.eql(undefined);
    });
  });

  describe('parseJsrSpecifier', () => {
    it('parses scoped and unscoped jsr specifiers', () => {
      expect(parseJsrSpecifier('jsr:@std/path@1.1.4')).to.eql('@std/path');
      expect(parseJsrSpecifier('jsr:@std/path@1.1.4/posix')).to.eql('@std/path/posix');
      expect(parseJsrSpecifier('jsr:yaml@2.8.2')).to.eql('yaml');
      expect(parseJsrSpecifier('jsr:yaml@2.8.2/types')).to.eql('yaml/types');
      expect(parseJsrSpecifier('jsr:')).to.eql(undefined);
    });
  });

  describe('resolveFromImportsMap', () => {
    it('resolves by longest prefix match', () => {
      const imports = {
        '@sys/http': 'jsr:@sys/http@0.0.209',
        '@sys/http/client': 'jsr:@sys/http@0.0.209/client',
      };
      expect(resolveFromImportsMap('@sys/http/client', imports)).to.eql(
        'jsr:@sys/http@0.0.209/client',
      );
      expect(resolveFromImportsMap('@sys/http/client/foo', imports)).to.eql(
        'jsr:@sys/http@0.0.209/client/foo',
      );
      expect(resolveFromImportsMap('@sys/unknown', imports)).to.eql(undefined);
    });

    it('resolves trailing-slash import-map prefixes', () => {
      const imports = {
        '@sys/ui-dom/': 'jsr:@sys/ui-dom@0.0.246/',
      };

      expect(resolveFromImportsMap('@sys/ui-dom/local-storage', imports)).to.eql(
        'jsr:@sys/ui-dom@0.0.246/local-storage',
      );
      expect(resolveFromImportsMap('@sys/ui-dom/user-agent', imports)).to.eql(
        'jsr:@sys/ui-dom@0.0.246/user-agent',
      );
    });
  });

  describe('createSpecifierRewrite', () => {
    it('rewrites npm specifiers', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json');
      const resolveId = rewrite.resolveId as (source: string) => Promise<string | null>;
      expect(await resolveId('npm:react@19.2.4')).to.eql(null);
    });

    it('rewrites npm specifiers for deno-owned importers', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json');
      const resolveId = rewrite.resolveId as (source: string, importer?: string) => Promise<string | null>;
      expect(
        await resolveId(
          'npm:@preact/signals-core@1.13.0',
          '\0deno::TypeScript::https://jsr.io/@sys/std/0.0.298/src/m.Signal/m.Is.ts::/tmp/cache/m.Is.ts',
        ),
      ).to.eql(null);
    });

    it('rewrites npm targets from import-map aliases for deno-owned importers', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json', {
        async loadImports() {
          return { react: 'npm:react@19.2.4' };
        },
      });

      const resolveId = rewrite.resolveId as (source: string, importer?: string) => Promise<string | null>;
      expect(
        await resolveId(
          'react',
          '\0deno::TypeScript::https://jsr.io/@sys/ui-dom/0.0.247/src/m.UserAgent/m.UserAgent.ts::/tmp/cache/m.UserAgent.ts',
        ),
      ).to.eql(null);
    });

    it('delegates normalized bare npm ids through vite resolution', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json', {
        async loadImports() {
          return { react: 'npm:react@19.2.4' };
        },
      });

      const resolveId = rewrite.resolveId as (
        this: { resolve(id: string, importer?: string, options?: { skipSelf?: boolean }): Promise<{ id: string } | null> },
        source: string,
        importer?: string,
      ) => Promise<string | null>;

      const res = await resolveId.call(
        {
          async resolve(id) {
            expect(id).to.eql('react');
            return { id: '/tmp/project/node_modules/react/index.mjs' };
          },
        },
        'react',
        '\0deno::TypeScript::https://jsr.io/@sys/ui-dom/0.0.247/src/m.UserAgent/m.UserAgent.ts::/tmp/cache/m.UserAgent.ts',
      );

      expect(res).to.eql('/tmp/project/node_modules/react/index.mjs');
    });

    it('returns null when a normalized bare npm id is still unresolved', async () => {
      const rewrite = createSpecifierRewrite('/tmp/project/deno.json', {
        async loadImports() {
          return { react: 'npm:react@19.2.4' };
        },
      });

      const resolveId = rewrite.resolveId as (
        this: { resolve(id: string, importer?: string, options?: { skipSelf?: boolean }): Promise<{ id: string } | null> },
        source: string,
        importer?: string,
      ) => Promise<string | null>;

      const res = await resolveId.call(
        {
          async resolve(id) {
            expect(id).to.eql('react');
            return null;
          },
        },
        'react',
        '\0deno::TypeScript::https://jsr.io/@sys/ui-dom/0.0.247/src/m.UserAgent/m.UserAgent.ts::/tmp/cache/m.UserAgent.ts',
      );

      expect(res).to.eql(null);
    });

    it('resolves remote deno importer npm ids from the project config location', async () => {
      const rewrite = createSpecifierRewrite('/tmp/project/deno.json', {
        async loadImports() {
          return { react: 'npm:react@19.2.4' };
        },
      });

      const resolveId = rewrite.resolveId as (
        this: { resolve(id: string, importer?: string, options?: { skipSelf?: boolean }): Promise<{ id: string } | null> },
        source: string,
        importer?: string,
      ) => Promise<string | null>;

      const importer = '\0deno::TypeScript::https://jsr.io/@sys/ui-dom/0.0.247/src/m.UserAgent/m.UserAgent.ts::/tmp/cache/m.UserAgent.ts';
      let seenImporter = '';

      const res = await resolveId.call(
        {
          async resolve(id, from) {
            expect(id).to.eql('react');
            seenImporter = from ?? '';
            return { id: '/tmp/project/node_modules/react/index.mjs' };
          },
        },
        'react',
        importer,
      );

      expect(seenImporter).to.eql('/tmp/project/deno.json');
      expect(res).to.eql('/tmp/project/node_modules/react/index.mjs');
    });

    it('passes through jsr-target import-map aliases (handled by deno plugin)', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json', {
        async loadImports() {
          return { '@acme/http': 'jsr:@sys/http@1.2.3' };
        },
      });

      const resolveId = rewrite.resolveId as (source: string) => Promise<string | null>;
      expect(await resolveId('@acme/http/client')).to.eql(null);
    });

    it('normalizes npm targets resolved from import-map aliases', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json', {
        async loadImports() {
          return { '@acme/ws': 'npm:@automerge/automerge-repo-network-websocket@2.5.3' };
        },
      });

      const resolveId = rewrite.resolveId as (source: string) => Promise<string | null>;
      expect(await resolveId('@acme/ws')).to.eql(null);
    });

    it('caches import-map lookups across repeated rewrites', async () => {
      let loadCalls = 0;

      const rewrite = createSpecifierRewrite('/tmp/deno.json', {
        async loadImports() {
          loadCalls++;
          return { '@sys/http/client': '/tmp/http-client.ts' };
        },
      });

      const resolveId = rewrite.resolveId as (source: string) => Promise<string | null>;
      const a = await resolveId('@sys/http/client');
      const b = await resolveId('@sys/http/client/foo');

      expect(a).to.eql('/tmp/http-client.ts');
      expect(b).to.eql('/tmp/http-client.ts/foo');
      expect(loadCalls).to.eql(1);
    });

    it('returns null for unresolved non-rewritten imports', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json', {
        async loadImports() {
          return { '@sys/http/client': 'jsr:@sys/http@0.0.209/client' };
        },
      });

      const resolveId = rewrite.resolveId as (source: string) => Promise<string | null>;
      expect(await resolveId('@sys/missing')).to.eql(null);
    });

    it('returns null for jsr-target rewrites to avoid fallback fs-loads', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json', {
        async loadImports() {
          return { '@acme/http': 'jsr:@sys/http@0.0.209' };
        },
      });

      const resolveId = rewrite.resolveId as (source: string) => Promise<string | null>;
      const res = await resolveId('@acme/http/client');
      expect(res).to.eql(null);
    });
  });

  describe('createNpmPrewarm', () => {
    it('warms npm targets declared in the import map', async () => {
      const warmed: string[] = [];
      const plugin = createNpmPrewarm('/tmp/project/deno.json', {
        async loadImports() {
          return {
            react: 'npm:react@19.2.4',
            'react-dom/': 'npm:react-dom@19.2.4/',
            '@sys/ui-dom': 'jsr:@sys/ui-dom@0.0.246',
          };
        },
        async warmNpm(specifier) {
          warmed.push(specifier);
        },
      });

      const buildStart = plugin.buildStart as () => Promise<void>;
      await buildStart();
      await buildStart();

      expect(warmed).to.eql(['npm:react@19.2.4', 'npm:react-dom@19.2.4']);
    });
  });
});
