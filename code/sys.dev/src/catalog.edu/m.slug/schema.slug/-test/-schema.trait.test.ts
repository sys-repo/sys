import { type t, c, describe, expect, expectTypeOf, it, Value } from '../../../-test.ts';
import { SlugSchema, TraitBindingSchema, TraitDefSchema } from '../mod.ts';

describe(`Slug/Traits:`, () => {
  describe('<T> type exports - JSR safe', () => {
    it('SlugTraitBindingOf<K> is assignable to SlugTraitBinding (generic)', () => {
      type K = 'foobar';
      type Narrow = t.SlugTraitBindingOf<K>;

      // Compile-time: Narrow assignable to SlugTraitBinding:
      type AssertAssignable = Narrow extends t.SlugTraitBinding ? true : never;
      const assertAssignable: AssertAssignable = true;

      let narrow!: Narrow;
      expectTypeOf(narrow).toEqualTypeOf<Narrow>();
    });
  });

  describe('TraitBindingSchema', () => {
    it('accepts valid binding { as, id }', () => {
      const ok = { as: 'trait-1', id: 'video' };
      expect(Value.Check(TraitBindingSchema, ok)).to.be.true;
    });

    it('rejects bad alias pattern', () => {
      const bads = [
        { as: '1bad', id: 'video' }, // ← must start with [a-z]
        { as: 'Bad', id: 'video' }, //  ← uppercase start
        { as: '', id: 'video' }, //     ← empty
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitBindingSchema, bad)).to.be.false;
      }
    });

    it('rejects bad trait id pattern', () => {
      const bads = [
        { as: 'x', id: 'Video' }, // uppercase start
        { as: 'x', id: '' }, // empty
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitBindingSchema, bad)).to.be.false;
      }
    });

    it('rejects additional properties', () => {
      const bad = { as: 'x', id: 'video', extra: true };
      expect(Value.Check(TraitBindingSchema, bad)).to.be.false;
    });
  });

  describe('TraitDefSchema', () => {
    it('accepts minimal trait def with id (props optional)', () => {
      const ok1 = { id: 'video' };
      const ok2 = { id: 'image-sequence', props: {} };
      expect(Value.Check(TraitDefSchema, ok1)).to.be.true;
      expect(Value.Check(TraitDefSchema, ok2)).to.be.true;
    });

    it('rejects additional properties on trait def', () => {
      const bad = { id: 'video', x: 1 };
      expect(Value.Check(TraitDefSchema, bad)).to.be.false;
    });

    it('rejects bad trait def id pattern', () => {
      const bads = [
        { id: 'Video' }, // ← capitalized
        { id: '' }, //      ← empty
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitDefSchema, bad)).to.be.false;
      }
    });
  });

  describe('Trait: integration shape within SlugSchema', () => {
    it('traits must contain only TraitBinding-shaped items', () => {
      const bad = {
        id: 's1',
        traits: [{ id: 'video' }], // missing `as`
      };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('props keys are strings; values are Unknown (structural pass only)', () => {
      const ok = {
        id: 's1',
        traits: [{ as: 't1', id: 'video' }],
        props: { t1: Symbol('anything-goes') as unknown }, // Unknown passes.
      };
      expect(Value.Check(SlugSchema, ok)).to.be.true;
    });
  });
});
