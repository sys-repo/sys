import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Value, type t } from '../traits.schema/common.ts';
import { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from '../traits.schema/mod.ts';

import { Slug } from '../common.ts';
import { TRAIT_IDS } from './m.ids.ts';
import { DefaultTraitRegistry } from './mod.ts';

describe('trait-registry', () => {
  const reg = DefaultTraitRegistry;

  /**
   * Shim to extract a TSchema for a given id regardless of registry surface:
   * - schema(id) →  TSchema
   * - get(id)    →  { propsSchema } | TSchema
   */
  function schemaOf(id: t.SchemaTraitId): t.TSchema | undefined {
    const anyReg = reg as any;
    if (typeof anyReg.schema === 'function') return anyReg.schema(id);
    if (typeof anyReg.get === 'function') {
      const entry = anyReg.get(id);
      if (!entry) return undefined;
      return 'propsSchema' in entry ? entry.propsSchema : entry;
    }
    return undefined;
  }

  it('type surface compiles', () => {
    const sampleReg: t.SlugTraitRegistry<t.SchemaTraitId> = reg;

    // Force a union-typed value (not a literal-constrained const):
    const someId = 'slug-index' as t.SchemaTraitId;

    expectTypeOf(sampleReg).toEqualTypeOf<t.SlugTraitRegistry<t.SchemaTraitId>>();
    expectTypeOf(someId).toEqualTypeOf<t.SchemaTraitId>();
  });

  describe('ids', () => {
    it('TRAIT_IDS includes all canonical ids (no duplicates)', () => {
      const sorted = [...TRAIT_IDS].sort();
      expect(sorted).to.eql(
        [
          // Traits:
          'slug-tree',
          'video-player',
          'video-recorder',
          'view-renderer',
          'concept-layout',
          'file-list',
        ].sort(),
      );
      expect(new Set(TRAIT_IDS).size).to.eql(TRAIT_IDS.length);
    });

    it('registry has schemas for all ids', () => {
      for (const id of TRAIT_IDS) {
        const s = schemaOf(id as t.SchemaTraitId);
        expect(Boolean(s)).to.eql(true, `missing schema for id: ${id}`);
      }
    });

    it('schema equality: each id maps to the expected schema', () => {
      expect(schemaOf('slug-tree')).to.equal(Slug.Schema.Slug.Tree.Props);
      expect(schemaOf('video-player')).to.equal(VideoPlayerPropsSchema);
      expect(schemaOf('video-recorder')).to.equal(VideoRecorderPropsSchema);
    });
  });

  describe('Value.Check smoke tests via registry schemas', () => {
    it('slug-tree: minimal sample', () => {
      const s = schemaOf('slug-tree')!;
      const ok: t.SlugTreeProps = [{ slug: 'intro', ref: 'crdt:create' }];
      expect(Value.Check(s, ok)).to.eql(true);
    });

    it('video-player: minimal sample', () => {
      const s = schemaOf('video-player')!;
      const ok = { name: 'player', src: 'crdt:create' };
      expect(Value.Check(s, ok)).to.eql(true);
    });

    it('video-recorder: minimal sample', () => {
      const s = schemaOf('video-recorder')!;
      const ok = { name: 'rec', file: 'crdt:create' };
      expect(Value.Check(s, ok)).to.eql(true);
    });
  });

  describe('negative samples (schema truth via registry)', () => {
    it('slug-tree: rejects bad ref pattern', () => {
      const s = schemaOf('slug-tree')!;
      const bad = { slugs: [{ label: 'x', ref: 'not-a-crdt-ref' }] };
      expect(Value.Check(s, bad)).to.eql(false);
    });

    it('slug-index: rejects missing ref', () => {
      const s = schemaOf('video-recorder')!;
      const bad = { slugs: [{ name: 'x' }] };
      expect(Value.Check(s, bad)).to.eql(false);
    });
  });

  describe('regsitry.get', () => {
    it('registry.get returns undefined for unknown ids', () => {
      // @ts-expect-error ensure we don't widen Id beyond t.SchemaTraitId
      const out = DefaultTraitRegistry.get('not-a-trait');
      expect(out).to.eql(undefined);
    });

    it('registry.get(id) mirrors the entry in .all', () => {
      for (const id of TRAIT_IDS) {
        const viaGet = DefaultTraitRegistry.get(id)!;
        const viaAll = DefaultTraitRegistry.all.find((e) => e.id === id)!;
        expect(viaGet).to.eql(viaAll);
      }
    });
  });

  describe('normalizer wiring via DefaultTraitRegistry', () => {
    it('video-player / video-recorder: no normalizer by default', () => {
      expect(DefaultTraitRegistry.get('video-player')!.normalize).to.eql(undefined);
      expect(DefaultTraitRegistry.get('video-recorder')!.normalize).to.eql(undefined);
    });
  });
});
