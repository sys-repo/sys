import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Pattern, Slug } from '../mod.ts';

describe('Slug (core)', () => {
  it('API', async () => {
    const m = await import('@sys/dev/catalog.edu/slug');
    expect(m.Slug).to.equal(Slug);
    expect(m.Pattern).to.equal(Pattern);

    // Schemas:
    const slugSchema = await import('../schema.slug/mod.ts');
    expect(m.Slug.Schema.Trait.Def).to.equal(slugSchema.TraitDefSchema);
    expect(m.Slug.Schema.Trait.Binding).to.equal(slugSchema.TraitBindingSchema);

    expect(m.Slug.Schema.Slug.Union).to.equal(slugSchema.SlugSchema);
    expect(m.Slug.Schema.Slug.WithData).to.equal(slugSchema.SlugWithDataSchema);
    expect(m.Slug.Schema.Slug.Ref).to.equal(slugSchema.SlugRefSchema);
    expect(m.Slug.Schema.Slug.Minimal).to.equal(slugSchema.SlugMinimalSchema);
  });

  describe('Slug.Is', () => {
    it('ref: true for ref-variant; false otherwise (runtime + narrowing)', () => {
      const refOnly: t.Slug = { ref: 'crdt:create' };
      const minimal: t.Slug = { id: 's1', traits: [] };
      const withData: t.Slug = { traits: [], data: {} };

      expect(Slug.Is.ref(refOnly)).to.eql(true);
      expect(Slug.Is.ref(minimal)).to.eql(false);
      expect(Slug.Is.ref(withData)).to.eql(false);

      if (Slug.Is.ref(refOnly)) {
        // Narrowed exactly to SlugRef
        expectTypeOf(refOnly).toEqualTypeOf<t.SlugRef>();
      }
    });

    it('inline: true for minimal/with-data; false for ref (runtime + narrowing)', () => {
      const refOnly: t.Slug = { ref: 'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' };
      const minimal: t.Slug = { traits: [] };
      const withData: t.Slug = { id: 'x', traits: [], data: {} };

      expect(Slug.Is.inline(minimal)).to.eql(true);
      expect(Slug.Is.inline(withData)).to.eql(true);
      expect(Slug.Is.inline(refOnly)).to.eql(false);

      if (Slug.Is.inline(minimal)) {
        // Guard returns union; type is exactly SlugMinimal | SlugWithData
        expectTypeOf(minimal).toEqualTypeOf<t.SlugMinimal | t.SlugWithData>();
      }

      // Combine guards to prove exact with-data narrowing.
      if (Slug.Is.inline(withData) && Slug.Has.data(withData)) {
        expectTypeOf(withData).toEqualTypeOf<t.SlugWithData>();
      }
    });
  });

  describe('Slug.Has', () => {
    it('traits: true for minimal/with-data that define traits; false for ref (runtime + union narrowing)', () => {
      const refOnly: t.Slug = { ref: 'crdt:create' };
      const minimalNoTraits: t.Slug = {};
      const minimalWithTraits: t.Slug = { traits: [] };
      const withData: t.Slug = { traits: [], data: {} };

      expect(Slug.Has.traits(refOnly)).to.eql(false);
      expect(Slug.Has.traits(minimalNoTraits)).to.eql(false);
      expect(Slug.Has.traits(minimalWithTraits)).to.eql(true);
      expect(Slug.Has.traits(withData)).to.eql(true);

      if (Slug.Has.traits(minimalWithTraits)) {
        // Guard returns union; exact type is SlugMinimal | SlugWithData
        type R = (t.SlugMinimal | t.SlugWithData) & { traits: readonly t.SlugTraitBinding[] };
        expectTypeOf(minimalWithTraits).toEqualTypeOf<R>();
      }
    });

    it('data: true only for with-data; false for minimal/ref (runtime + exact narrowing)', () => {
      const refOnly: t.Slug = { ref: 'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/section.1' };
      const minimal: t.Slug = { id: 's1', traits: [] };
      const withData: t.Slug = { traits: [], data: {} };

      expect(Slug.Has.data(refOnly)).to.eql(false);
      expect(Slug.Has.data(minimal)).to.eql(false);
      expect(Slug.Has.data(withData)).to.eql(true);

      if (Slug.Has.data(withData)) {
        // Exact variant confirmed
        expectTypeOf(withData).toEqualTypeOf<t.SlugWithData>();
      }
    });
  });
});
