import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Slug } from '../../mod.ts';

import type { t } from '../common.ts';
import { Value } from '../common.ts';
import { SlugTreeItemSchema, SlugTreePropsSchema } from '../mod.ts';

describe('trait: slug-tree', () => {
  describe('exports / shape', () => {
    it('Traits exposes slug-tree schemas', () => {
      expect(Slug.Schema.Slug.Tree.Item).to.equal(SlugTreeItemSchema);
      expect(Slug.Schema.Slug.Tree.Props).to.equal(SlugTreePropsSchema);
    });

    it('type surface compiles (union: RefOnly | Inline)', () => {
      const refOnly: t.SlugTreeItemRefOnly = { slug: 'intro', ref: 'crdt:create' };
      const inline: t.SlugTreeItemInline = { slug: 'section-a', description: 'overview' };
      const u: t.SlugTreeItem = Math.random() > -1 ? refOnly : inline;

      expectTypeOf(refOnly).toEqualTypeOf<t.SlugTreeItemRefOnly>();
      expectTypeOf(inline).toEqualTypeOf<t.SlugTreeItemInline>();
      expectTypeOf(u).toEqualTypeOf<t.SlugTreeItem>();

      const props: t.SlugTreeProps = [refOnly, inline];
      expectTypeOf(props).toEqualTypeOf<t.SlugTreeProps>();
    });
  });

  describe('Value.Check (valid cases)', () => {
    it('valid: minimal empty tree', () => {
      const ok: t.SlugTreeProps = [];
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: ref-only (slug + ref)', () => {
      const ok = [{ slug: 'intro', ref: 'crdt:create' }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: inline minimal (slug only)', () => {
      const ok = [{ slug: 'root' }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: inline with description', () => {
      const ok = [{ slug: 'section-a', description: 'overview' }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: inline with traits and data', () => {
      const ok = [
        {
          slug: 'video',
          traits: [{ of: 'video-player', as: 'vid' }],
          data: { vid: { source: 'intro.mp4', start: 3.2 } },
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: inline with children', () => {
      const ok = [
        {
          slug: 'root',
          slugs: [
            { slug: 'child-ref', ref: 'crdt:create' }, // ref-only child
            { slug: 'child-inline', description: 'hello' }, // inline child
          ],
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: deep tree with mixed forms', () => {
      const ok = [
        {
          slug: 'level-1',
          slugs: [
            {
              slug: 'level-2-ref',
              ref: 'crdt:create',
            },
            {
              slug: 'level-2-inline',
              traits: [{ of: 'video-player', as: 'vid' }],
              data: { vid: { start: 1.5 } },
              slugs: [{ slug: 'level-3-ref', ref: 'crdt:create' }],
            },
          ],
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: accepts allowed ref forms (crdt:create | urn:crdt:BASE62[/path])', () => {
      const base62 = 'abcdefghijklmnopqrstuvwxyzAB'; // 28 chars
      const ok = [
        { slug: 'create', ref: 'crdt:create' },
        { slug: 'urn-root', ref: `urn:crdt:${base62}` },
        { slug: 'urn-path', ref: `urn:crdt:${base62}/foo.bar-1` },
      ] as const;

      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: schema-only allows empty traits array and empty data object', () => {
      const ok = [
        { slug: 'empty-traits', traits: [] },
        { slug: 'empty-data', data: {} },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: inline traits without data (trait stub)', () => {
      const ok = [{ slug: 'vid', traits: [{ of: 'video-player', as: 'vid' }] }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: schema-only allows data keys not declared in traits (binding checked elsewhere)', () => {
      const ok = [
        {
          slug: 'my-thing',
          traits: [{ of: 'video-player', as: 'vid' }],
          data: {
            vid1: { src: 'https://example.com/clip.mp4' }, // not declared in traits[]
          },
        },
      ] as const;

      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('edge: group with empty slugs array', () => {
      const ok = [{ slug: 'my-section', slugs: [] }] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('edge: duplicate slugs allowed (identity by position, not name)', () => {
      const ok = [
        { slug: 'dup', ref: 'crdt:create' },
        { slug: 'dup', slugs: [{ slug: 'child', ref: 'crdt:create' }] },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });

  describe('Value.Check (invalid cases)', () => {
    it('invalid: missing slug (required in both variants)', () => {
      const bad = [{ ref: 'crdt:create' }];
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: slug empty string', () => {
      const bad = [{ slug: '', ref: 'crdt:create' }] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: root must be an array (not object)', () => {
      const bad: any = { slug: 'not-in-array' };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: unknown extra property rejected', () => {
      const bad = [{ slug: 'x', foo: 123 }];
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: slugs must be array', () => {
      const bad = [{ slug: 'x', slugs: {} }];
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: bad ref format', () => {
      const bad = [{ slug: 'x', ref: 'bad-ref' }] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: bad ref format deep in children', () => {
      const bad = [{ slug: 'root', slugs: [{ slug: 'child', ref: 'not-a-valid-ref' }] }] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid (ref-only variant): any extra keys along with ref', () => {
      const extras = [
        { slug: 'x', ref: 'crdt:create', description: 'nope' },
        { slug: 'x', ref: 'crdt:create', traits: [] },
        { slug: 'x', ref: 'crdt:create', data: {} },
        { slug: 'x', ref: 'crdt:create', slugs: [] },
        { slug: 'x', ref: 'crdt:create', traits: [], data: {} },
      ] as const;

      for (const bad of extras) {
        expect(Value.Check(SlugTreePropsSchema, [bad])).to.eql(false);
      }
    });

    it('invalid (inline variant): ref is not allowed when any inline fields are present', () => {
      const bads = [
        { slug: 'x', ref: 'crdt:create', description: 'nope' },
        { slug: 'x', ref: 'crdt:create', traits: [] },
        { slug: 'x', ref: 'crdt:create', data: {} },
        { slug: 'x', ref: 'crdt:create', slugs: [] },
      ] as const;

      for (const bad of bads) {
        expect(Value.Check(SlugTreePropsSchema, [bad])).to.eql(false);
      }
    });

    it('invalid (hybrid): ref together with traits/data/slugs', () => {
      const bad = [
        {
          slug: 'hybrid',
          ref: 'crdt:create',
          traits: [{ of: 'image-sequence', as: 'gallery' }],
          data: { gallery: { files: ['a.png', 'b.png'] } },
        },
      ] as const;

      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: unknown key inside nested child item', () => {
      const bad = [
        {
          slug: 'a',
          slugs: [
            {
              slug: 'b',
              foo: 123, // unknown
            },
          ],
        },
      ] as const;
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });
  });
});
