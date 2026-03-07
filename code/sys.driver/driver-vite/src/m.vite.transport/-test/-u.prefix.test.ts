import { describe, expect, it } from '../../-test.ts';
import prefixPlugin from '../u.prefix.ts';

describe('ViteTransport.prefix', () => {
  it('declares the pre-resolve deno prefix plugin', () => {
    const plugin = prefixPlugin(new Map());
    expect(plugin.name).to.eql('deno:prefix');
    expect(plugin.enforce).to.eql('pre');
  });

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
      {
        async resolve(id: string) {
          expect(id).to.eql('react');
          return undefined;
        },
      },
      'npm:react@19.2.0',
    );

    expect(res).to.eql('react');
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
      { async resolve() {} },
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

    const res = await plugin.resolveId.call({ async resolve() {} }, './local.ts');
    expect(res).to.eql(undefined);
  });
});
