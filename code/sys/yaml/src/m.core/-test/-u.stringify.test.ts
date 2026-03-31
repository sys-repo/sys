import { type t, describe, expect, expectTypeOf, Is, it } from '../../-test.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.stringify', () => {
  it('returns Ok with a YAML string for a plain value', () => {
    const value = { foo: 123, bar: 'baz' } as const;
    const res = Yaml.stringify(value);

    // Result union type.
    expectTypeOf(res).toEqualTypeOf<t.YamlStringifyResult>();

    // Ok arm selected.
    expect(res.error).to.be.undefined;

    if (!res.data) throw new Error('Expected Yaml.stringify to yield data');

    // Branded YAML string type.
    expectTypeOf(res.data).toEqualTypeOf<t.StringYaml>();
    expect(Is.string(res.data)).to.eql(true);

    // Basic content sanity.
    expect(res.data).to.contain('foo: 123');
    expect(res.data).to.contain('bar: baz');

    // Round-trip sanity check.
    const parsed = Yaml.parse<typeof value>(res.data);
    expect(parsed.error).to.be.undefined;
    if (!parsed.data) throw new Error('Expected parse to yield data');
    expect(parsed.data).to.eql(value);
  });

  it('passes through stringify options (e.g. indent)', () => {
    const value = {
      parent: { child: 1 },
    } as const;

    const resDefault = Yaml.stringify(value);
    const resIndented = Yaml.stringify(value, { indent: 4 });

    if (!resDefault.data || !resIndented.data) {
      throw new Error('Expected both stringify calls to yield data');
    }

    expect(resDefault.error).to.be.undefined;
    expect(resIndented.error).to.be.undefined;

    // Child line indentation should increase with higher indent.
    const [, childDefault] = resDefault.data.split('\n');
    const [, childIndented] = resIndented.data.split('\n');

    const leading = (line: string) => line.length - line.trimStart().length;

    expect(childDefault).to.contain('child: 1');
    expect(childIndented).to.contain('child: 1');
    expect(leading(childIndented)).to.be.greaterThan(leading(childDefault));
  });

  it('supports mutable AST formatting hooks during stringify', () => {
    const value = {
      subpaths: ['main', 't'],
      block: ['keep', 'expanded'],
    } as const;

    const res = Yaml.stringify(value, {
      format(ctx) {
        if (ctx.key === 'subpaths' && Yaml.Is.seq(ctx.node)) {
          ctx.node.flow = true;
        }
      },
    });

    if (!res.data) throw new Error('Expected Yaml.stringify to yield data');

    expect(res.error).to.be.undefined;
    expect(res.data).to.contain('subpaths: [ main, t ]');
    expect(res.data).to.contain('block:\n  - keep\n  - expanded');
  });

  it('exposes path and stop through stringify format context', () => {
    const value = {
      subpaths: ['main', 't'],
      block: ['keep', 'expanded'],
    } as const;

    const seen: Array<string> = [];
    const res = Yaml.stringify(value, {
      format(ctx) {
        seen.push(ctx.path.join('.'));
        if (ctx.key === 'subpaths' && Yaml.Is.seq(ctx.node)) {
          ctx.node.flow = true;
          ctx.stop();
        }
      },
    });

    if (!res.data) throw new Error('Expected Yaml.stringify to yield data');

    expect(res.error).to.be.undefined;
    expect(seen).to.include('subpaths');
    expect(seen).to.not.include('block');
    expect(res.data).to.contain('subpaths: [ main, t ]');
    expect(res.data).to.contain('block:\n  - keep\n  - expanded');
  });

  it('keeps default sequence rendering in block style without a format hook', () => {
    const value = {
      subpaths: ['join', 'posix/join', 'windows/join'],
      other: ['cors'],
    } as const;

    const res = Yaml.stringify(value);

    if (!res.data) throw new Error('Expected Yaml.stringify to yield data');

    expect(res.error).to.be.undefined;
    expect(res.data).to.include('subpaths:');
    expect(res.data).to.include('- join');
    expect(res.data).to.include('- posix/join');
    expect(res.data).to.include('- windows/join');
    expect(res.data).to.include('- cors');
    expect(res.data).to.not.include('subpaths: [');
  });

  it('returns Err when the underlying yaml.stringify throws', () => {
    const boom = new Error('toJSON boom');

    const value = {
      toJSON() {
        throw boom;
      },
    };

    const res = Yaml.stringify(value as unknown);

    // Err arm selected.
    expect(res.data).to.be.undefined;
    expect(res.error).to.not.be.undefined;

    if (!res.error) throw new Error('Expected Yaml.stringify to yield an error');

    // StdError shape + useful message.
    expectTypeOf(res.error).toEqualTypeOf<t.StdError>();
    expect(Is.string(res.error.message)).to.eql(true);
    expect(res.error.message).to.contain('toJSON boom');
  });
});
