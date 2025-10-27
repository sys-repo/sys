import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Value } from '../common.ts';
import { SlugIndexPropsSchema, Traits } from '../mod.ts';

describe('trait: slug-index', () => {
  describe('schema', () => {
    it('requires index; validates minimal object', () => {
      expect(Value.Check(SlugIndexPropsSchema, {})).to.eql(false); // missing required `index`
      expect(Value.Check(SlugIndexPropsSchema, { slugs: [] })).to.eql(true);
    });

    it('accepts entries with/without name; valid CRDT refs', () => {
      const ok1 = {
        slugs: [
          { name: 'Intro', ref: 'urn:crdt:123e4567-e89b-12d3-a456-426614174000/slug' },
          { ref: 'crdt:abcdefghijklmnopqrstuvwxyzAB/path/to' }, // base62-28 + path
        ],
      };
      expect(Value.Check(SlugIndexPropsSchema, ok1)).to.eql(true);
    });

    it('rejects empty item.name', () => {
      const bad = { index: [{ name: '', ref: 'crdt:abcdefghijklmnopqrstuvwxyzAB' }] };
      expect(Value.Check(SlugIndexPropsSchema, bad)).to.eql(false);
    });

    it('rejects bad refs', () => {
      const bad1 = { index: [{ ref: 'not-a-crdt-ref' }] };
      const bad2 = { index: [{ ref: 'crdt:' }] };
      const bad3 = { index: [{ ref: 'urn:crdt:' }] };
      expect(Value.Check(SlugIndexPropsSchema, bad1)).to.eql(false);
      expect(Value.Check(SlugIndexPropsSchema, bad2)).to.eql(false);
      expect(Value.Check(SlugIndexPropsSchema, bad3)).to.eql(false);
    });

    it('rejects additionalProperties on items', () => {
      const bad = { index: [{ ref: 'crdt:abcdefghijklmnopqrstuvwxyzAB', extra: true }] };
      expect(Value.Check(SlugIndexPropsSchema, bad as unknown)).to.eql(false);
    });

    it('has id/title metadata', () => {
      expect(typeof SlugIndexPropsSchema.$id).to.eql('string');
      expect(typeof SlugIndexPropsSchema.title).to.eql('string');
    });
  });

  describe('types & guard', () => {
    it('SlugTraitBindingOf<"slug-index"> is assignable to SlugTraitBinding', () => {
      type Narrow = t.SlugTraitBindingOf<'slug-index'>;

      // One-way assignability (compile-time only):
      type Assignable = Narrow extends t.SlugTraitBinding ? true : never;
      const assertAssignable: Assignable = true;

      // Satisfy expectTypeOf:
      let sample!: Narrow;
      expectTypeOf(sample).toEqualTypeOf<Narrow>();

      // `id` (trait "of") literal stays locked to "slug-index":
      let id!: Narrow['of'];
      expectTypeOf(id).toEqualTypeOf<'slug-index'>();
    });

    it('Slug.Is.slugIndexBinding signature stays correct', () => {
      type Expect = (m: unknown) => m is t.SlugTraitBindingOf<'slug-index'>;
      const fn = Traits.Is.slugIndexBinding;
      expectTypeOf(fn).toEqualTypeOf<Expect>();

      // Minimal runtime sanity:
      expect(fn({ id: 'slug-index', as: 'idx1' })).to.eql(true);
      expect(fn({ id: 'video-player', as: 'idx1' })).to.eql(false);
      expect(fn({ id: 'slug-index' })).to.eql(false);
      expect(fn(null)).to.eql(false);
    });
  });
});
