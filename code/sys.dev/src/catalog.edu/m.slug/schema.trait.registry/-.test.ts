import { describe, expect, expectTypeOf, it, Value } from '../../-test.ts';
import { Type as T } from './common.ts';
import { makeRegistry } from './mod.ts';

describe('TraitRegistry (local mock)', () => {
  const registry = makeRegistry([
    {
      id: 'trait-index',
      propsSchema: T.Object({ slugs: T.Array(T.String()) }, { additionalProperties: false }),
    },
    { id: 'trait-alpha', propsSchema: T.Object({ name: T.Optional(T.String({ minLength: 1 })) }) },
    { id: 'trait-beta', propsSchema: T.Object({ name: T.Optional(T.String({ minLength: 1 })) }) },
  ]);

  it('exposes the seeded ids in stable order', () => {
    type Entry = (typeof registry)['all'][number];
    const ids = (registry.all as readonly Entry[]).map((d) => d.id);
    expect(ids).to.eql(['trait-index', 'trait-alpha', 'trait-beta']);
  });

  it('get(id) returns entries; unknown returns <undefined>', () => {
    const a = registry.get('trait-alpha');
    const b = registry.get('trait-beta');
    const c = registry.get('trait-index');
    const none = registry.get('nope' as never);
    expect(!!a && !!b && !!c).to.eql(true);
    expect(none).to.eql(undefined);
  });

  it('prop-schemas accept minimal shapes', () => {
    const alpha = registry.get('trait-alpha')!;
    const beta = registry.get('trait-beta')!;
    const index = registry.get('trait-index')!;
    expect(Value.Check(alpha.propsSchema, { name: 'Alpha' })).to.eql(true);
    expect(Value.Check(beta.propsSchema, { name: 'Beta' })).to.eql(true);
    expect(Value.Check(index.propsSchema, { slugs: [] })).to.eql(true);
  });

  it('prop-schemas reject empty name', () => {
    const alpha = registry.get('trait-alpha')!;
    const beta = registry.get('trait-beta')!;
    const index = registry.get('trait-index')!;
    expect(Value.Check(alpha.propsSchema, { name: '' })).to.eql(false);
    expect(Value.Check(beta.propsSchema, { name: '' })).to.eql(false);
    expect(Value.Check(index.propsSchema, { name: '', slugs: [] })).to.eql(false);
  });

  it('ids are unique (dev sanity)', () => {
    type Entry = (typeof registry)['all'][number];
    const ids = (registry.all as readonly Entry[]).map((d) => d.id);
    const unique = new Set(ids);
    expect(unique.size).to.eql(ids.length);
  });

  it('is strongly typed', () => {
    type Id = Parameters<typeof registry.get>[0];

    // Compile-time equality (zero runtime effect with dummy arg)
    expectTypeOf<Id>(undefined as unknown as Id).toEqualTypeOf<
      'trait-index' | 'trait-alpha' | 'trait-beta'
    >();

    // Runtime usage (compile-time checked)
    registry.get('trait-alpha');
    registry.get('trait-beta');
    registry.get('trait-index');

    // Compile-time negative: unknown id must not be assignable.
    type _ShouldError = 'nope' extends Id ? true : false;
    expectTypeOf<_ShouldError>(false as unknown as _ShouldError).toEqualTypeOf<false>();
  });

  it('guard: throws on duplicate ids', () => {
    const dup = [
      { id: 'trait-alpha', propsSchema: T.Object({}) },
      { id: 'trait-alpha', propsSchema: T.Object({}) },
    ] as const;
    expect(() => makeRegistry(dup as any)).to.throw();
  });
});
