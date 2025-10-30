import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { SlugTree } from '../m.SlugTree.ts';
import { Slug } from '../mod.ts';

describe('Slug.Tree', () => {
  it('API', () => {
    expect(Slug.Tree).to.equal(SlugTree);
  });

  describe('Slug.Tree.Is', () => {
    const Is = SlugTree.Is;

    describe('Is.props', () => {
      it('signature', () => {
        type Expect = (u: unknown) => u is t.SlugTreeProps;
        expectTypeOf(Is.props).toEqualTypeOf<Expect>();
      });

      it('runtime truth table: valid cases', () => {
        const ok0: unknown = [];
        const ok1: unknown = [{ slug: 'Root' }];
        const ok2: unknown = [
          {
            slug: 'A',
            slugs: [
              { slug: 'B', ref: 'crdt:create' },
              { slug: 'C', slugs: [{ slug: 'D', ref: 'crdt:create' }] },
            ],
          },
        ];
        const ok3_schemaOnlyPermissive: unknown = [
          {
            slug: 'Hybrid',
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
        const badRefDeep: unknown = [{ slug: 'A', slugs: [{ slug: 'B', ref: 'bad-ref' }] }];
        const unknownKeyNested: unknown = [{ slug: 'A', slugs: [{ slug: 'B', foo: 123 }] }];

        expect(Is.props(notArray)).to.eql(false);
        expect(Is.props(missingSlug)).to.eql(false);
        expect(Is.props(emptySlug)).to.eql(false);
        expect(Is.props(badRefDeep)).to.eql(false);
        expect(Is.props(unknownKeyNested)).to.eql(false);
      });

      it('narrows to t.SlugTreeProps', () => {
        const input: unknown = [{ slug: 'Z', slugs: [{ slug: 'Y', ref: 'crdt:create' }] }];
        if (Is.props(input)) {
          // Type narrowing:
          expectTypeOf(input).toEqualTypeOf<t.SlugTreeProps>();
          // A couple of concrete runtime checks:
          expect(Array.isArray(input)).to.eql(true);
          expect(input[0].slug).to.eql('Z');
          expect(Array.isArray(input[0].slugs)).to.eql(true);
        } else {
          expect(true).to.eql(false);
        }
      });
    });
  });
});
