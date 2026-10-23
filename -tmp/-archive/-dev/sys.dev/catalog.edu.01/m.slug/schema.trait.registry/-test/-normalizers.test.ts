import { type t, describe, expect, expectTypeOf, it, Value } from '../../../-test.ts';
import { Type as T } from '../common.ts';

describe('registry.normalizers', () => {
  it('type surface compiles', () => {
    type Id = 'slug-tree' | 'video-player';

    // SlugTraitNormalizer
    type ExpectFn = (input: unknown) => unknown;
    expectTypeOf<t.SlugTraitNormalizer>(null as any).toEqualTypeOf<ExpectFn>();

    // SlugTraitNormalizers<K>
    type MapExpect = Partial<Record<Id, t.SlugTraitNormalizer>>;
    expectTypeOf<t.SlugTraitNormalizers<Id>>(null as any).toEqualTypeOf<MapExpect>();

    // Entry + Registry
    type EntryExpect = {
      readonly id: Id;
      readonly propsSchema: t.TSchema;
      readonly normalize?: t.SlugTraitNormalizer;
    };
    expectTypeOf<t.SlugTraitRegistryEntry<Id>>(null as any).toEqualTypeOf<EntryExpect>();

    type RegistryExpect = {
      readonly all: readonly t.SlugTraitRegistryEntry<Id>[];
      get(id: Id): t.SlugTraitRegistryEntry<Id> | undefined;
    };
    expectTypeOf<t.SlugTraitRegistry<Id>>(null as any).toEqualTypeOf<RegistryExpect>();
  });

  it('normalizer → canonical → schema truth', () => {
    // Schema: { items: string[] } with no additional properties.
    const CanonicalSchema: t.TSchema = T.Object(
      { items: T.Array(T.String()) },
      { additionalProperties: false },
    );

    // Authoring form: string[] (eg: YAML DSL)
    const authoring = ['a', 'b', 'c'];

    // Normalizer: authoring string[] → { items: string[] }
    const normalize: t.SlugTraitNormalizer = (input) => {
      if (!Array.isArray(input)) return { items: [] };
      return { items: input };
    };

    // Registry with optional normalize hook:
    const entry: t.SlugTraitRegistryEntry<'slug-tree'> = {
      id: 'slug-tree',
      propsSchema: CanonicalSchema,
      normalize,
    };

    // Sanity:
    expect(typeof entry.normalize).to.eql('function');

    // Apply normalize then validate:
    const canonical = entry.normalize?.(authoring);
    expect(Value.Check(entry.propsSchema, canonical)).to.eql(true);

    // A bad value still fails the schema:
    const badCanonical = { items: [1, 2, 3] };
    expect(Value.Check(entry.propsSchema, badCanonical)).to.eql(false);
  });

  it('registry.get mirrors identity with .all (deep equal, not reference)', () => {
    const schema: t.TSchema = T.Object({ ok: T.Boolean() });
    const entries: readonly t.SlugTraitRegistryEntry<'x' | 'y'>[] = [
      { id: 'x', propsSchema: schema },
      { id: 'y', propsSchema: schema },
    ] as const;

    const reg: t.SlugTraitRegistry<'x' | 'y'> = {
      get all() {
        return [...entries]; // ← Return a fresh array (common real-world pattern)
      },
      get(id) {
        return reg.all.find((e) => e.id === id);
      },
    };

    for (const e of reg.all) {
      const viaGet = reg.get(e.id)!;
      expect(viaGet).to.eql(e); // ← Same value, not necessarily same reference
    }
  });
});
