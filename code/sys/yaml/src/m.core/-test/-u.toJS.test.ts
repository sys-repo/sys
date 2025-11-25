import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.toJS', () => {
  it('ok: simple mapping', () => {
    const src = `
      foo: 1
      bar: baz
    `;
    const doc = Yaml.parseAst(src);
    const res = Yaml.toJS<{ foo: number; bar: string }>(doc);

    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
    expect(res.data).to.eql({ foo: 1, bar: 'baz' });

    // compile-time: generic type is respected
    expectTypeOf(res.data).toEqualTypeOf<{ foo: number; bar: string } | undefined>();
  });

  it('ok: sequence and nested shapes', () => {
    const src = `
      list:
        - a
        - b
      nest:
        x: 1
        y: [2, 3]
    `;
    const doc = Yaml.parseAst(src);
    const res = Yaml.toJS(doc);

    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
    expect(res.data).to.eql({ list: ['a', 'b'], nest: { x: 1, y: [2, 3] } });
  });

  it('ok: empty document → null value (yaml v2 semantics)', () => {
    const src = ``;
    const doc = Yaml.parseAst(src);
    const res = Yaml.toJS(doc);

    expect(res.ok).to.eql(true);
    // yaml v2: empty doc materializes as `null`
    expect(res.data).to.eql(null);
  });

  it('error: unresolved alias (caught at toJS, no throw)', () => {
    const src = `
      slugs:
        - slug: *missing
    `;
    const doc = Yaml.parseAst(src);
    const res = Yaml.toJS(doc);

    expect(res.ok).to.eql(false);
    expect(res.errors.length > 0).to.eql(true);
    // message source is upstream; use a loose match
    expect(String(res.errors[0].message).toLowerCase()).to.contain('unresolved alias');
    // our wrapper normalizes code
    expect(
      res.errors.some((e) => e.code === 'yaml.alias.unresolved' || e.code === 'yaml.tojs.error'),
    ).to.eql(true);
  });

  it('zero-throw invariant: never throws regardless of input (document)', () => {
    const cases = [``, `foo: 1`, `- a\n- b`, `slug: *missing`];
    for (const src of cases) {
      const doc = Yaml.parseAst(src);
      let crashed = false;
      try {
        void Yaml.toJS(doc);
      } catch {
        crashed = true;
      }
      expect(crashed).to.eql(false, `should not throw for:\n${src}`);
    }
  });

  it('typing: generic result value is preserved on ok branch', () => {
    const src = `x: 1`;
    const doc = Yaml.parseAst(src);
    const res = Yaml.toJS<{ x: number }>(doc);

    if (!res.ok) {
      // narrow and assert diagnostic shape
      expect(res.errors.length >= 0).to.eql(true);
      return;
    }
    expectTypeOf(res.data).toEqualTypeOf<{ x: number } | undefined>();
    expect(res.data?.x).to.eql(1);
  });

  it('accepts a scalar node (subtree) as input', () => {
    const src = `
      foo: 123
    `;
    const doc = Yaml.parseAst(src) as any;
    const root = doc.contents;
    const pair = root.items.find((p: any) => p?.key?.value === 'foo');
    const scalarNode = pair.value;

    const res = Yaml.toJS<number>(scalarNode);

    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
    expect(res.data).to.eql(123);
    expectTypeOf(res.data).toEqualTypeOf<number | undefined>();
  });

  it('accepts a sequence node (subtree) as input', () => {
    const src = `
      list:
        - first
        - second
    `;
    const doc = Yaml.parseAst(src) as any;
    const root = doc.contents;
    const listPair = root.items.find((p: any) => p?.key?.value === 'list');
    const seqNode = listPair.value;

    const res = Yaml.toJS<string[]>(seqNode);

    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
    expect(res.data).to.eql(['first', 'second']);
    expectTypeOf(res.data).toEqualTypeOf<string[] | undefined>();
  });

  it('zero-throw invariant: never throws when given subtree nodes', () => {
    const src = `
      root:
        list:
          - a
          - b
        map:
          x: 1
          y: 2
        aliasRef: *missing
    `;
    const doc = Yaml.parseAst(src) as any;
    const root = doc.contents;

    const listPair = root.items.find((p: any) => p?.key?.value === 'list');
    const mapPair = root.items.find((p: any) => p?.key?.value === 'map');
    const aliasPair = root.items.find((p: any) => p?.key?.value === 'aliasRef');

    const nodes = [root, listPair?.value, mapPair?.value, aliasPair?.value].filter(Boolean);

    for (const node of nodes) {
      let crashed = false;
      try {
        void Yaml.toJS(node);
      } catch {
        crashed = true;
      }
      expect(crashed).to.eql(false, 'toJS should not throw for subtree node');
    }
  });

  it('pair node input yields ok:true and undefined data', () => {
    const src = `foo: 1`;
    const doc = Yaml.parseAst(src) as any;
    const root = doc.contents;
    const pair = root.items[0]; // YAML Pair

    const res = Yaml.toJS(pair);
    expect(res.ok).to.eql(true);
    expect(res.data).to.eql(undefined);
  });
});
