import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Tree } from '../mod.ts';

describe('Slug.Tree.Is', () => {
  const Is = Tree.Is;

  describe('Is.props', () => {
    it('signature', () => {
      type Expect = (u: unknown) => u is t.SlugTreeProps;
      expectTypeOf(Is.props).toEqualTypeOf<Expect>();
    });

    it('runtime truth table: valid cases', () => {
      const ok0: unknown = [];
      const ok1: unknown = [{ slug: 'root' }];
      const ok2: unknown = [
        {
          slug: 'a',
          slugs: [
            { slug: 'b', ref: 'crdt:create' },
            { slug: 'c', slugs: [{ slug: 'd', ref: 'crdt:create' }] },
          ],
        },
      ];
      const ok3_schemaOnlyPermissive: unknown = [
        {
          slug: 'hybrid',
          traits: [{ of: 'video-player', as: 'vid' }],
          data: {
            // schema-only: alias mismatch is allowed here; binding is separate
            vid1: { src: 'https://example.com/clip.mp4' },
          },
        },
      ];

      expect(Is.props(ok0)).to.eql(true);
      expect(Is.props(ok1)).to.eql(true);
      expect(Is.props(ok2)).to.eql(true);
      expect(Is.props(ok3_schemaOnlyPermissive)).to.eql(true);
    });

    it('runtime truth table: invalid cases', () => {
      const notArray: unknown = { slug: 'nope' };
      const missingSlug: unknown = [{ ref: 'crdt:create' }];
      const emptySlug: unknown = [{ slug: '' }];
      const badRefDeep: unknown = [{ slug: 'a', slugs: [{ slug: 'b', ref: 'bad-ref' }] }];
      const unknownKeyNested: unknown = [{ slug: 'a', slugs: [{ slug: 'b', foo: 123 }] }];

      expect(Is.props(notArray)).to.eql(false);
      expect(Is.props(missingSlug)).to.eql(false);
      expect(Is.props(emptySlug)).to.eql(false);
      expect(Is.props(badRefDeep)).to.eql(false);
      expect(Is.props(unknownKeyNested)).to.eql(false);
    });

    it('narrows to t.SlugTreeProps', () => {
      const input: unknown = [{ slug: 'z', slugs: [{ slug: 'y', ref: 'crdt:create' }] }];
      if (Is.props(input)) {
        // Type narrowing:
        expectTypeOf(input).toEqualTypeOf<t.SlugTreeProps>();

        // Concrete runtime checks:
        expect(Array.isArray(input)).to.eql(true);
        const first = input[0];
        expect(first.slug).to.eql('z');

        // Narrow to the inline variant before touching "slugs":
        if ('slugs' in first) {
          expect(Array.isArray(first.slugs)).to.eql(true);
        } else {
          expect.fail('expected inline variant with "slugs"');
        }
      } else {
        expect.fail('Is.props should have narrowed');
      }
    });
  });

  describe('Is.item / Is.itemInline / Is.itemRef (signatures)', () => {
    it('Is.item signature', () => {
      type Expect = (u: unknown) => u is t.SlugTreeItem;
      expectTypeOf(Is.item).toEqualTypeOf<Expect>();
    });

    it('Is.itemInline signature', () => {
      type Expect = (u: unknown) => u is t.SlugTreeItemInline;
      expectTypeOf(Is.itemInline).toEqualTypeOf<Expect>();
    });

    it('Is.itemRef signature', () => {
      type Expect = (u: unknown) => u is t.SlugTreeItemRefOnly;
      expectTypeOf(Is.itemRef).toEqualTypeOf<Expect>();
    });
  });

  describe('Is.itemRef (runtime)', () => {
    it('true: ref-only node', () => {
      const v: unknown = { slug: 'a', ref: 'crdt:create' };
      expect(Is.itemRef(v)).to.eql(true);
    });

    it('false: inline node', () => {
      const v: unknown = { slug: 'a', traits: [{ of: 'video-player', as: 'vid' }] };
      expect(Is.itemRef(v)).to.eql(false);
    });

    it('false: missing slug', () => {
      const v: unknown = { ref: 'crdt:create' };
      expect(Is.itemRef(v)).to.eql(false);
    });
  });

  describe('Is.itemInline (runtime)', () => {
    it('true: minimal inline', () => {
      const v: unknown = { slug: 'a' };
      expect(Is.itemInline(v)).to.eql(true);
    });

    it('true: inline with traits/data/slugs', () => {
      const v: unknown = {
        slug: 'a',
        traits: [{ of: 'video-player', as: 'vid' }],
        data: { vid: { src: 'ok' } },
        slugs: [{ slug: 'b', ref: 'crdt:create' }],
      };
      expect(Is.itemInline(v)).to.eql(true);
    });

    it('false: has ref', () => {
      const v: unknown = { slug: 'a', ref: 'crdt:create' };
      expect(Is.itemInline(v)).to.eql(false);
    });

    it('false: non-object or missing slug', () => {
      expect(Is.itemInline(null)).to.eql(false);
      expect(Is.itemInline(123 as unknown)).to.eql(false);
      expect(Is.itemInline({} as unknown)).to.eql(false);
    });
  });

  describe('Is.item (runtime + disjointness)', () => {
    it('true for inline and for ref-only', () => {
      const inline: unknown = { slug: 'x' };
      const refOnly: unknown = { slug: 'y', ref: 'crdt:create' };
      expect(Is.item(inline)).to.eql(true);
      expect(Is.item(refOnly)).to.eql(true);
    });

    it('disjoint: itemRef => !itemInline, and vice versa', () => {
      const A: unknown = { slug: 'a', ref: 'crdt:create' };
      const B: unknown = { slug: 'b' };
      expect(Is.itemRef(A)).to.eql(true);
      expect(Is.itemInline(A)).to.eql(false);
      expect(Is.itemInline(B)).to.eql(true);
      expect(Is.itemRef(B)).to.eql(false);
    });

    it('false for invalid shapes', () => {
      expect(Is.item(undefined)).to.eql(false);
      expect(Is.item({})).to.eql(false);
      expect(Is.item({ ref: 'crdt:create' })).to.eql(false);
      expect(Is.item({ slug: '' })).to.eql(false); // schema would reject empty slug
    });
  });

  describe('narrowing behavior', () => {
    it('itemRef narrows to SlugTreeItemRefOnly', () => {
      const v: unknown = { slug: 'a', ref: 'crdt:create' };
      if (Is.itemRef(v)) {
        expectTypeOf(v).toEqualTypeOf<t.SlugTreeItemRefOnly>();
        expect(v.slug).to.eql('a');
        expect(v.ref).to.eql('crdt:create');
      } else {
        expect.fail('Is.itemRef should have narrowed');
      }
    });

    it('itemInline narrows to SlugTreeItemInline', () => {
      const v: unknown = { slug: 'a', slugs: [{ slug: 'b', ref: 'crdt:create' }] };
      if (Is.itemInline(v)) {
        expectTypeOf(v).toEqualTypeOf<t.SlugTreeItemInline>();
        expect(v.slug).to.eql('a');
        if ('slugs' in v) {
          expect(Array.isArray(v.slugs)).to.eql(true);
          expect(v.slugs?.[0]?.slug).to.eql('b');
        }
      } else {
        expect.fail('Is.itemInline should have narrowed');
      }
    });

    it('item narrows to union', () => {
      const v: unknown = { slug: 'z' };
      if (Is.item(v)) {
        expectTypeOf(v).toEqualTypeOf<t.SlugTreeItem>();
        expect(v.slug).to.eql('z');
      } else {
        expect.fail('Is.item should have narrowed');
      }
    });
  });
});
