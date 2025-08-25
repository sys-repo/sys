import { type t, describe, it, expect, expectTypeOf } from '../../-test.ts';
import { Schema } from '../mod.ts';

describe('StandardSchema', () => {
  it('wraps a TypeBox schema and validates (success path)', () => {
    const S = Schema.Type.Object({
      name: Schema.Type.String(),
      age: Schema.Type.Number(),
    });
    const Std = Schema.toStandardSchema(S);

    const input = { name: 'Ada', age: 37 };
    const res = Std['~standard'].validate(input);

    expect(res.ok).to.equal(true);
    if (res.ok) {
      // type inference: value is Static<typeof S>
      expectTypeOf(res.value).toEqualTypeOf<{ name: string; age: number }>();
      expect(res.value).to.eql(input);
    }
  });

  it('returns issues on failure with decoded object paths', () => {
    const S = Schema.Type.Object({
      user: Schema.Type.Object({
        tags: Schema.Type.Array(
          Schema.Type.Object({ id: Schema.Type.Number(), label: Schema.Type.String() }),
        ),
      }),
    });
    const Std = Schema.toStandardSchema(S);

    // Invalid: tags[0].id should be number, but is string
    const bad = { user: { tags: [{ id: '1', label: 'x' }] } };
    const res = Std['~standard'].validate(bad);

    expect(res.ok).to.equal(false);
    if (!res.ok) {
      // At least one issue, with precise path
      const [issue] = res.issues;
      expect(issue.path).to.eql(['user', 'tags', 0, 'id']); // numeric index preserved
      expect(issue.message).to.be.a('string').and.not.equal('');
    }
  });

  it('strict (no coercion): "123" is not a number', () => {
    const S = Schema.Type.Object({ n: Schema.Type.Number() });
    const Std = Schema.toStandardSchema(S);

    const res1 = Std['~standard'].validate({ n: 123 });
    const res2 = Std['~standard'].validate({ n: '123' });

    expect(res1.ok).to.equal(true);
    expect(res2.ok).to.equal(false);
    if (!res2.ok) {
      // path points to offending property
      expect(res2.issues[0]?.path).to.eql(['n']);
    }
  });

  it('does not mutate the original schema (pure adapter)', () => {
    const S = Schema.Type.Object({ x: Schema.Type.String() });
    // The TypeBox schema should not carry "~standard"
    expect('~standard' in (S as unknown as Record<string, unknown>)).to.equal(false);

    const Std = Schema.toStandardSchema(S);
    // Adapter carries "~standard"
    expect('~standard' in (Std as unknown as Record<string, unknown>)).to.equal(true);

    // Identity check: the original schema is unchanged
    expect(Schema.Value.Check(S, { x: 'ok' })).to.equal(true);
  });

  it('vendor metadata: default "sys" and explicit override', () => {
    const S = Schema.Type.Object({ ok: Schema.Type.Boolean() });
    const A = Schema.toStandardSchema(S); // default vendor
    const B = Schema.toStandardSchema(S, 'acme'); // explicit vendor

    expect(A['~standard'].version).to.equal('1.0.0');
    expect(A['~standard'].vendor).to.equal('sys');
    expect(B['~standard'].vendor).to.equal('acme');
  });

  it('type inference: Output equals Static<typeof S>', () => {
    const S = Schema.Type.Object({
      id: Schema.Type.String(),
      meta: Schema.Type.Object({ count: Schema.Type.Number() }),
    });
    const Std = Schema.toStandardSchema(S);

    const res = Std['~standard'].validate({ id: 'a', meta: { count: 1 } });
    if (res.ok) {
      type Out = typeof res.value;
      // Exact structural type check:
      expectTypeOf<Out>(res.value).toEqualTypeOf<{ id: string; meta: { count: number } }>();
    } else {
      throw new Error('expected ok result');
    }
  });

  it('aggregates multiple issues (stable order not guaranteed by spec)', () => {
    const S = Schema.Type.Object({
      a: Schema.Type.Number(),
      b: Schema.Type.String(),
    });
    const Std = Schema.toStandardSchema(S);

    const res = Std['~standard'].validate({ a: 'nope', b: 42 });
    expect(res.ok).to.equal(false);
    if (!res.ok) {
      // We expect at least two issues somewhere at paths ['a'] and ['b'].
      const paths = res.issues.map((i) => i.path as readonly (string | number)[]);
      expect(paths.some((p) => p.length === 1 && p[0] === 'a')).to.equal(true);
      expect(paths.some((p) => p.length === 1 && p[0] === 'b')).to.equal(true);
    }
  });
});
