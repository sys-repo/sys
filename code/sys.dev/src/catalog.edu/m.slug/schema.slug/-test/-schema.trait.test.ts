import { type t, describe, expect, expectTypeOf, it, Value } from '../../../-test.ts';
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
      const ok = { as: 'trait-1', of: 'video' };
      expect(Value.Check(TraitBindingSchema, ok)).to.be.true;

      // Also valid under new idPattern (leading digit, dots, hyphens)
      const ok2 = { as: 'trait-1.0', of: 'video.player-01' };
      expect(Value.Check(TraitBindingSchema, ok2)).to.be.true;

      const ok3 = { as: '1x', of: '2d-plot' };
      expect(Value.Check(TraitBindingSchema, ok3)).to.be.true;
    });

    it('rejects bad alias pattern', () => {
      const bads = [
        // { as: '1bad', id: 'video' }, //  ← now valid (leading digit allowed)
        { as: 'Bad', id: 'video' }, //      ← uppercase start still invalid
        { as: '', id: 'video' }, //         ← empty
        { as: '_bad', id: 'video' }, //     ← underscore not allowed
        { as: '-bad', id: 'video' }, //     ← cannot start with hyphen
        { as: 'bad_', id: 'video' }, //     ← underscore not allowed anywhere
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitBindingSchema, bad)).to.be.false;
      }
    });

    it('rejects bad trait id pattern', () => {
      const bads = [
        { as: 'x', id: 'Video' }, //      ← uppercase start
        { as: 'x', id: '' }, //           ← empty
        { as: 'x', id: '_video' }, //     ← underscore not allowed
        { as: 'x', id: 'video_id' }, //   ← underscore not allowed
        { as: 'x', id: '-video' }, //     ← cannot start with hyphen
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

      // Dotted/hyphenated ids now valid:
      const ok3 = { id: 'video.player-01' };
      expect(Value.Check(TraitDefSchema, ok3)).to.be.true;
    });

    it('rejects additional properties on trait def', () => {
      const bad = { id: 'video', x: 1 };
      expect(Value.Check(TraitDefSchema, bad)).to.be.false;
    });

    it('rejects bad trait def id pattern', () => {
      const bads = [
        { id: 'Video' }, //     ← capitalized
        { id: '' }, //          ← empty
        { id: '_video' }, //    ← underscore not allowed
        { id: '-video' }, //    ← cannot start with hyphen
        { id: 'video_id' }, //  ← underscore not allowed anywhere
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitDefSchema, bad)).to.be.false;
      }
    });
  });

  describe('Trait: integration shape within SlugSchema', () => {
    it('props keys may include dots when alias includes dots', () => {
      const ok = {
        id: 's1',
        traits: [{ as: 't1.0', of: 'video' }],
        // note: quoted key because dot is not an identifier
        props: { 't1.0': Symbol('anything-goes') as unknown },
      };
      expect(Value.Check(SlugSchema, ok)).to.be.true;
    });

    it('traits must contain only TraitBinding-shaped items', () => {
      const bad = {
        id: 's1',
        traits: [{ of: 'video' }], // missing `as`
      };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('props keys are strings; values are Unknown (structural pass only)', () => {
      const ok = {
        id: 's1',
        traits: [{ as: 't1', of: 'video' }],
        props: { t1: Symbol('anything-goes') as unknown }, // Unknown passes.
      };
      expect(Value.Check(SlugSchema, ok)).to.be.true;
    });
  });
});
