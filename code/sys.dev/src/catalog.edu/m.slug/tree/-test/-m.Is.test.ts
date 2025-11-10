import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { SlugTree } from '../mod.ts';

describe('Slug.Tree.Is', () => {
  const Is = SlugTree.Is;

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
});
