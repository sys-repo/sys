import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Schema } from '../mod.ts';

describe('StandardSchema', () => {
  describe('toStandardSchema', () => {
    it('wraps a TypeBox schema and validates (success path)', () => {
      const S = Schema.Type.Object({ name: Schema.Type.String(), age: Schema.Type.Number() });
      const Std = Schema.toStandardSchema(S);

      const input = { name: 'Ada', age: 37 };
      const res = Std['~standard'].validate(input);

      expect(res.ok).to.eql(true);
      if (res.ok) {
        // Type inference: value is Static<typeof S>.
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

      // Invalid: tags[0].id should be number, but is string:
      const bad = { user: { tags: [{ id: '1', label: 'x' }] } };
      const res = Std['~standard'].validate(bad);

      expect(res.ok).to.eql(false);
      if (!res.ok) {
        // At least one issue, with precise path:
        const [issue] = res.issues;
        expect(issue.path).to.eql(['user', 'tags', 0, 'id']); // ← Numeric index preserved,
        expect(issue.message).to.be.a('string').and.not.equal('');
      }
    });

    it('strict (no coercion): "123" is not a number', () => {
      const S = Schema.Type.Object({ n: Schema.Type.Number() });
      const Std = Schema.toStandardSchema(S);

      const res1 = Std['~standard'].validate({ n: 123 });
      const res2 = Std['~standard'].validate({ n: '123' });

      expect(res1.ok).to.eql(true);
      expect(res2.ok).to.eql(false);
      if (!res2.ok) {
        // Path points to offending property:
        expect(res2.issues[0]?.path).to.eql(['n']);
      }
    });

    it('does not mutate the original schema (pure adapter)', () => {
      const S = Schema.Type.Object({ x: Schema.Type.String() });
      const Std = Schema.toStandardSchema(S);

      // The TypeBox schema should not carry "~standard":
      expect('~standard' in S).to.eql(false);

      // The Adapter does carry "~standard"
      expect('~standard' in Std).to.eql(true);

      // Identity check: the original schema is unchanged:
      expect(Schema.Value.Check(S, { x: 'ok' })).to.eql(true);
    });

    it('vendor metadata: default "sys" and explicit override', () => {
      const S = Schema.Type.Object({ ok: Schema.Type.Boolean() });
      const A = Schema.toStandardSchema(S); //         ← default vendor
      const B = Schema.toStandardSchema(S, 'acme'); // ← explicit vendor

      expect(A['~standard'].version).to.eql('1.0.0');
      expect(A['~standard'].vendor).to.eql('sys');
      expect(B['~standard'].vendor).to.eql('acme');
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
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        // We expect at least two issues somewhere at paths ['a'] and ['b'].
        const paths = res.issues.map((i) => i.path as readonly (string | number)[]);
        expect(paths.some((p) => p.length === 1 && p[0] === 'a')).to.eql(true);
        expect(paths.some((p) => p.length === 1 && p[0] === 'b')).to.eql(true);
      }
    });
  });

  describe('isStandardSchema', () => {
    const isStandardSchema = Schema.isStandardSchema;

    it('returns false for non-objects and objects without ~standard', () => {
      expect(isStandardSchema(null)).to.eql(false);
      expect(isStandardSchema(undefined)).to.eql(false);
      expect(isStandardSchema(123)).to.eql(false);
      expect(isStandardSchema({})).to.eql(false);
      expect(isStandardSchema({ '~standard': {} })).to.eql(false);
      expect(isStandardSchema({ '~standard': { version: '1.0.0', vendor: 'x' } })).to.be.false; // no validate().
    });

    it('returns true for objects exposing the v1 surface', () => {
      const std = {
        '~standard': {
          version: '1.0.0' as const,
          vendor: 'x',
          validate: (_: unknown) => ({ ok: true as const, value: _ }),
        },
      } as const;
      expect(Schema.isStandardSchema(std)).to.eql(true);
    });
  });

  describe('asStandardSchema', () => {
    it('passes through when already StandardSchema (identity)', () => {
      const std = {
        '~standard': {
          version: '1.0.0',
          vendor: 'passthrough',
          validate: (_: unknown) => ({ ok: true, value: _ }),
        },
      } as const;

      const normalized = Schema.asStandardSchema(std);
      expect(normalized).to.eql(std); // ← identity
      const ok = normalized['~standard'].validate({ a: 1 });
      expect(ok.ok).to.eql(true);
    });

    it('wraps a TypeBox schema via toStandardSchema (no mutation)', () => {
      const S = Schema.Type.Object({
        user: Schema.Type.Object({
          tags: Schema.Type.Array(
            Schema.Type.Object({ id: Schema.Type.Number(), label: Schema.Type.String() }),
          ),
        }),
      });

      // Original schema should not have `~standard`:
      expect('~standard' in (S as unknown as Record<string, unknown>)).to.be.false;

      const std = Schema.asStandardSchema(S, 'sys');
      expect('~standard' in (std as unknown as Record<string, unknown>)).to.be.true;

      // Valid:
      const ok = std['~standard'].validate({ user: { tags: [{ id: 1, label: 'x' }] } });
      expect(ok.ok).to.eql(true);

      // Invalid (string instead of number) → path decodes with numeric index:
      const bad = std['~standard'].validate({ user: { tags: [{ id: '1', label: 'x' }] } });
      expect(bad.ok).to.eql(false);
      if (!bad.ok) {
        const [issue] = bad.issues;
        expect(issue.path).to.eql(['user', 'tags', 0, 'id']);
        expect(issue.message).to.be.a('string');
      }
    });

    it('respects vendor override when wrapping', () => {
      const S = Schema.Type.Object({ ok: Schema.Type.Boolean() });
      const std = Schema.asStandardSchema(S, 'acme');
      expect(std['~standard'].version).to.eql('1.0.0');
      expect(std['~standard'].vendor).to.eql('acme');
    });
  });
});
