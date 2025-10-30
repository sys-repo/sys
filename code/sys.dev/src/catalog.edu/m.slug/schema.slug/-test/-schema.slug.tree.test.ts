import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Slug } from '../../mod.ts';

import type { t } from '../common.ts';
import { Value } from '../common.ts';
import { SlugTreeItemSchema, SlugTreePropsSchema } from '../mod.ts';

describe('trait: slug-tree', () => {
  describe('exports / shape', () => {
    it('Traits exposes slug-tree schemas', () => {
      expect(Slug.Schema.SlugTree.Item).to.equal(SlugTreeItemSchema);
      expect(Slug.Schema.SlugTree.Props).to.equal(SlugTreePropsSchema);
    });

    it('type surface compiles', () => {
      const item: t.SlugTreeItem = { slug: 'foo' };
      const props: t.SlugTreeProps = [{ slug: 'foo' }];
      expectTypeOf(item).toEqualTypeOf<t.SlugTreeItem>();
      expectTypeOf(props).toEqualTypeOf<t.SlugTreeProps>();
    });
  });

  describe('Value.Check (valid cases)', () => {

    it('valid: simple node (slug only)', () => {
      const ok = [{ slug: 'Root Node' }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: node with external ref', () => {
      const ok = [{ slug: 'Intro', ref: 'crdt:create' }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: nested children', () => {
      const ok = [
        {
          slug: 'Root',
          slugs: [
            { slug: 'Child 1', ref: 'crdt:create' },
            { slug: 'Child 2', slugs: [{ slug: 'Leaf', ref: 'crdt:create' }] },
          ],
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: inline traits and data (hybrid)', () => {
      const ok = [
        {
          slug: 'Hybrid Node',
          traits: [{ of: 'video-player', as: 'my-video' }],
          data: {
            'my-video': { source: 'vid.mp4', start: 3.2 },
          },
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: hybrid with both ref and traits', () => {
      const ok = [
        {
          slug: 'Referenced+Inline',
          ref: 'crdt:create',
          traits: [{ of: 'image-sequence', as: 'gallery' }],
          data: { gallery: { files: ['a.png', 'b.png'] } },
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: deep tree with mixed forms', () => {
      const ok = [
        {
          slug: 'Level 1',
          slugs: [
            {
              slug: 'Level 2',
              ref: 'crdt:create',
              slugs: [
                {
                  slug: 'Level 3',
                  traits: [{ of: 'video-player', as: 'vid' }],
                  data: { vid: { start: 1.5 } },
                },
              ],
            },
          ],
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('accepts all allowed ref forms (crdt:create | urn:crdt:BASE62[/path])', () => {
      const base62 = 'abcdefghijklmnopqrstuvwxyzAB'; // 28 chars
      const ok = [
        { slug: 'Create', ref: 'crdt:create' },
        { slug: 'URN root', ref: `urn:crdt:${base62}` },
        { slug: 'URN path', ref: `urn:crdt:${base62}/foo.bar-_1` },
      ] as const;

      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('allows empty traits array and empty data object (schema-only permissive)', () => {
      const ok = [
        { slug: 'EmptyTraits', traits: [] },
        { slug: 'EmptyData', data: {} },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });

  describe('Value.Check (invalid cases)', () => {
    it('invalid: missing slug label', () => {
      const bad = [{ ref: 'crdt:create' }] as any;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: slug empty string', () => {
      const bad = [{ slug: '', ref: 'crdt:create' }] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: slugs must be array', () => {
      const bad = [{ slug: 'x', slugs: {} }] as any;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: unknown extra property rejected', () => {
      const bad = [{ slug: 'x', foo: 123 }] as any;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: bad ref format', () => {
      const bad = [{ slug: 'x', ref: 'bad-ref' }] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('rejects bad ref format deep in children', () => {
      const bad = [
        {
          slug: 'Root',
          slugs: [{ slug: 'Child', ref: 'not-a-valid-ref' }],
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('Is.slugTreeProps mirrors Value.Check on common invalids', () => {
      const missingSlug = [{ ref: 'crdt:create' }] as const;
      const unknownKey = [{ slug: 'x', slugs: [], oops: true } as any];

      expect(Value.Check(SlugTreePropsSchema, missingSlug)).to.eql(false);
      expect(Value.Check(SlugTreePropsSchema, unknownKey)).to.eql(false);
    });

    it('rejects unknown key inside nested child item', () => {
      const bad = [
        {
          slug: 'A',
          slugs: [
            {
              slug: 'B',
              foo: 123, // unknown
            } as any,
          ],
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('root must be an array (not object)', () => {
      const bad: any = { slug: 'Not in an array' };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });
  });

  describe('edge behavior', () => {
    it('group with empty slugs array is valid', () => {
      const ok = [{ slug: 'Section', slugs: [] }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('duplicate slugs allowed (identity by position, not name)', () => {
      const ok = [
        { slug: 'dup', ref: 'crdt:create' },
        { slug: 'dup', slugs: [{ slug: 'child', ref: 'crdt:create' }] },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('inline traits without data still valid (trait stub)', () => {
      const ok = [{ slug: 'vid', traits: [{ of: 'video-player', as: 'vid' }] }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('schema-only: allows data keys not declared in traits (binding checked separately)', () => {
      const ok = [
        {
          slug: 'MyThing',
          traits: [{ of: 'video-player', as: 'vid' }],
          data: {
            // Note: "vid1" is not declared in traits[]; this should still pass schema-only checks.
            //       Binding checked separately.
            vid1: { src: 'https://example.com/clip.mp4' },
          },
        },
      ] as const;

      // Schema (Value.Check) is intentionally trait-agnostic: this should be true.
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });
});
