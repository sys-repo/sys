import { type t, c, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { AliasResolver } from '../mod.ts';

describe('AliasResolver.analyze (basic)', () => {
  it('print', () => {
    const obj = {
      alias: {
        ':valid': '/ok/path',
        ':bad-type': 42, // valid key, invalid value
        NotAnAlias: '/nope', // invalid key
      },
    };

    const res = AliasResolver.analyze(obj);
    const { diagnostics } = res;

    // Sanity: we expect at least one diagnostic
    expect(diagnostics.length).to.be.greaterThan(0);

    // Pick the diagnostic that best teaches the structure:
    const example = diagnostics.find((d) => d.kind === 'alias:non-string-value') ?? diagnostics[0];

    // Pretty print for educational purposes.
    console.info(c.cyan('\nExample AliasResolver diagnostic:\n'));
    console.info(res);
    console.info(example);
    console.info();
  });

  it('returns resolver + empty diagnostics for a valid alias table', () => {
    const obj = {
      alias: {
        ':core': '/slug/data/prog.core',
        ':p2p': '/slug/data/prog.p2p',
      },
      other: { foo: 123 },
    };

    const { resolver, diagnostics } = AliasResolver.analyze(obj);

    // Root and alias map.
    expect(resolver.root).to.eql(obj);
    expect(resolver.alias).to.eql({
      ':core': '/slug/data/prog.core',
      ':p2p': '/slug/data/prog.p2p',
    });

    // No diagnostics for clean table.
    expect(diagnostics).to.eql([]);
  });
});

describe('AliasResolver.analyze (table diagnostics)', () => {
  it('reports non-object alias tables and falls back to empty map', () => {
    const obj = { alias: 'not-an-object' as unknown };
    const { resolver, diagnostics } = AliasResolver.analyze(obj);

    // Alias map is empty when the table is not an object.
    expect(resolver.alias).to.eql({});

    // One diagnostic describing the problem.
    expect(diagnostics.length).to.eql(1);
    const d = diagnostics[0];

    expect(d.kind).to.eql('alias:non-object-table');
    expect(d.path).to.eql(['alias']);
    expect(d.value).to.eql('not-an-object');
    expect(d.message).to.be.a('string');
  });

  it('does not emit diagnostics when alias table is missing', () => {
    const obj = { foo: 123 };
    const { resolver, diagnostics } = AliasResolver.analyze(obj);
    expect(resolver.alias).to.eql({});
    expect(diagnostics).to.eql([]);
  });
});

describe('AliasResolver.analyze (entry diagnostics)', () => {
  it('reports invalid keys and non-string values and keeps only valid entries', () => {
    const obj = {
      alias: {
        ':ok': '/path/ok',
        'not-an-alias': '/path/bad-key',
        ':wrong-type': 123,
      },
    };

    const { resolver, diagnostics } = AliasResolver.analyze(obj);

    // Only the valid alias survives into the map.
    expect(resolver.alias).to.eql({ ':ok': '/path/ok' });

    // We expect at least the two specific diagnostics we care about.
    expect(diagnostics.length).to.be.at.least(2);

    const invalidKey = diagnostics.find((d) => d.kind === 'alias:invalid-key');
    expect(invalidKey, 'missing alias:invalid-key diagnostic').to.not.eql(undefined);
    expect(invalidKey!.key).to.eql('not-an-alias');
    expect(invalidKey!.path).to.eql(['alias', 'not-an-alias']);

    const nonString = diagnostics.find((d) => d.kind === 'alias:non-string-value');
    expect(nonString, 'missing alias:non-string-value diagnostic').to.not.eql(undefined);
    expect(nonString!.key).to.eql(':wrong-type');
    expect(nonString!.path).to.eql(['alias', ':wrong-type']);
    expect(nonString!.value).to.eql(123);
  });
});

describe('AliasResolver.analyze (root/alias options)', () => {
  it('honors custom root and alias paths', () => {
    const obj = {
      slug: {
        parsed: {
          meta: {
            alias: { ':core': '/slug/data/prog.core' },
          },
        },
      },
    };

    const { resolver, diagnostics } = AliasResolver.analyze(obj, {
      root: ['slug', 'parsed'],
      alias: ['meta', 'alias'],
    });

    // Root is the sub-object at the given root path.
    expect(resolver.root).to.eql(obj.slug.parsed);

    // Alias map is built from the nested table.
    expect(resolver.alias).to.eql({
      ':core': '/slug/data/prog.core',
    });

    // No diagnostics for clean, nested table.
    expect(diagnostics).to.eql([]);
  });
});

describe('AliasResolver.analyze (types)', () => {
  it('returns diagnostics with the Alias.Diagnostic shape', () => {
    const obj = { alias: { 'not-an-alias': 123 } };
    const analysis = AliasResolver.analyze(obj);
    expectTypeOf(analysis.diagnostics).toEqualTypeOf<readonly t.Alias.Diagnostic[]>();
  });
});
