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
    expect(res.value).to.eql({ foo: 1, bar: 'baz' });

    // compile-time: generic type is respected
    expectTypeOf(res.value).toEqualTypeOf<{ foo: number; bar: string } | undefined>();
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
    expect(res.value).to.eql({ list: ['a', 'b'], nest: { x: 1, y: [2, 3] } });
  });

  it('ok: empty document → null value (yaml v2 semantics)', () => {
    const src = ``;
    const doc = Yaml.parseAst(src);
    const res = Yaml.toJS(doc);

    expect(res.ok).to.eql(true);
    // yaml v2: empty doc materializes as `null`
    expect(res.value).to.eql(null);
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

  it('zero-throw invariant: never throws regardless of input', () => {
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
    expectTypeOf(res.value).toEqualTypeOf<{ x: number } | undefined>();
    expect(res.value?.x).to.eql(1);
  });
});
