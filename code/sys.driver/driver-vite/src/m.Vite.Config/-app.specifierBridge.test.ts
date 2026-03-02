import { describe, expect, it } from '../-test.ts';
import {
  createSpecifierBridge,
  parseDenoInfoRoot,
  parseNpmSpecifier,
  resolveFromImportsMap,
} from './u.app.specifierBridge.ts';

describe('ViteConfig.app specifier bridge', () => {
  describe('parseNpmSpecifier', () => {
    it('parses scoped and unscoped npm specifiers', () => {
      expect(parseNpmSpecifier('npm:react@19.2.4')).to.eql('react');
      expect(parseNpmSpecifier('npm:react@19.2.4/jsx-runtime')).to.eql('react/jsx-runtime');
      expect(parseNpmSpecifier('npm:@scope/pkg@1.2.3')).to.eql('@scope/pkg');
      expect(parseNpmSpecifier('npm:@scope/pkg@1.2.3/sub/path')).to.eql('@scope/pkg/sub/path');
      expect(parseNpmSpecifier('npm:')).to.eql(undefined);
    });
  });

  describe('parseDenoInfoRoot', () => {
    it('parses roots from deno info output', () => {
      const json = JSON.stringify({ roots: ['jsr:@sys/ui-react@0.0.241'] });
      expect(parseDenoInfoRoot(json)).to.eql('jsr:@sys/ui-react@0.0.241');
    });

    it('returns undefined on malformed json', () => {
      expect(parseDenoInfoRoot('nope')).to.eql(undefined);
      expect(parseDenoInfoRoot('{}')).to.eql(undefined);
    });
  });

  describe('resolveFromImportsMap', () => {
    it('resolves by longest prefix match', () => {
      const imports = {
        '@sys/http': 'jsr:@sys/http@0.0.209',
        '@sys/http/client': 'jsr:@sys/http@0.0.209/client',
      };
      expect(resolveFromImportsMap('@sys/http/client', imports)).to.eql('jsr:@sys/http@0.0.209/client');
      expect(resolveFromImportsMap('@sys/http/client/foo', imports)).to.eql(
        'jsr:@sys/http@0.0.209/client/foo',
      );
      expect(resolveFromImportsMap('@sys/unknown', imports)).to.eql(undefined);
    });
  });

  describe('createSpecifierBridge', () => {
    it('resolves npm specifiers without invoking deno lookup', async () => {
      let calls = 0;
      const bridge = createSpecifierBridge('/tmp/deno.json', {
        async resolveSysSpecifier() {
          calls++;
          return undefined;
        },
      });

      const resolveId = bridge.resolveId as (source: string) => Promise<string | null>;
      expect(await resolveId('npm:react@19.2.4')).to.eql('react');
      expect(calls).to.eql(0);
    });

    it('caches @sys specifier resolution', async () => {
      let calls = 0;
      const bridge = createSpecifierBridge('/tmp/deno.json', {
        async resolveSysSpecifier(_configPath, specifier) {
          calls++;
          return `jsr:${specifier}@0.0.1`;
        },
      });

      const resolveId = bridge.resolveId as (source: string) => Promise<string | null>;
      const a = await resolveId('@sys/http/client');
      const b = await resolveId('@sys/http/client');
      expect(a).to.eql('jsr:@sys/http/client@0.0.1');
      expect(b).to.eql('jsr:@sys/http/client@0.0.1');
      expect(calls).to.eql(1);
    });

    it('uses imports-map resolution before deno info fallback', async () => {
      let fallbackCalls = 0;
      let loadCalls = 0;

      const bridge = createSpecifierBridge('/tmp/deno.json', {
        async loadImports() {
          loadCalls++;
          return { '@sys/http/client': 'jsr:@sys/http@0.0.209/client' };
        },
        async resolveSysSpecifier() {
          fallbackCalls++;
          return 'jsr:@sys/http/client@fallback';
        },
      });

      const resolveId = bridge.resolveId as (source: string) => Promise<string | null>;
      const a = await resolveId('@sys/http/client');
      const b = await resolveId('@sys/http/client/foo');

      expect(a).to.eql('jsr:@sys/http@0.0.209/client');
      expect(b).to.eql('jsr:@sys/http@0.0.209/client/foo');
      expect(loadCalls).to.eql(1);
      expect(fallbackCalls).to.eql(0);
    });
  });
});
