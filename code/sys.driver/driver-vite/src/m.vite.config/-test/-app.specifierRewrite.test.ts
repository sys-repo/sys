import { describe, expect, it } from '../../-test.ts';
import { createSpecifierRewrite, parseJsrSpecifier, parseNpmSpecifier, resolveFromImportsMap } from '../u.app.specifierRewrite.ts';

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
  });

  describe('createSpecifierRewrite', () => {
    it('rewrites npm specifiers', async () => {
      const rewrite = createSpecifierRewrite('/tmp/deno.json');
      const resolveId = rewrite.resolveId as (source: string) => Promise<string | null>;
      expect(await resolveId('npm:react@19.2.4')).to.eql('react');
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
      expect(await resolveId('@acme/ws')).to.eql(
        '@automerge/automerge-repo-network-websocket',
      );
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
});
