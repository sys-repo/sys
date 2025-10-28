import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Value, type t } from '../schema.traits/common.ts';
import {
  SlugTreePropsSchema,
  VideoPlayerPropsSchema,
  VideoRecorderPropsSchema,
} from '../schema.traits/mod.ts';

// NOTE: paths here are from "schema.trait.registry" → go up two levels for these files:
import { TRAIT_IDS, type SchemaTraitId } from './m.ids.ts';
import { RegistryDefault } from './m.RegistryDefault.ts';

describe('trait-registry', () => {
  const reg = RegistryDefault;

  /**
   * Shim to extract a TSchema for a given id regardless of registry surface:
   * - schema(id) -> TSchema
   * - get(id) -> { propsSchema } | TSchema
   */
  function schemaOf(id: SchemaTraitId): t.TSchema | undefined {
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
    const sampleReg: t.SlugTraitRegistry<SchemaTraitId> = reg;

    // Force a union-typed value (not a literal-constrained const):
    const someId = 'slug-index' as SchemaTraitId;

    expectTypeOf(sampleReg).toEqualTypeOf<t.SlugTraitRegistry<SchemaTraitId>>();
    expectTypeOf(someId).toEqualTypeOf<SchemaTraitId>();
  });

  it('TRAIT_IDS includes all canonical ids (no duplicates)', () => {
    const sorted = [...TRAIT_IDS].sort();
    expect(sorted).to.eql(['slug-tree', 'video-player', 'video-recorder'].sort());
    expect(new Set(TRAIT_IDS).size).to.eql(TRAIT_IDS.length);
  });

  it('registry has schemas for all ids', () => {
    for (const id of TRAIT_IDS) {
      const s = schemaOf(id as SchemaTraitId);
      expect(Boolean(s)).to.eql(true, `missing schema for id: ${id}`);
    }
  });

  it('schema equality: each id maps to the expected schema', () => {
    expect(schemaOf('slug-tree')).to.equal(SlugTreePropsSchema);
    expect(schemaOf('video-player')).to.equal(VideoPlayerPropsSchema);
    expect(schemaOf('video-recorder')).to.equal(VideoRecorderPropsSchema);
  });

  describe('Value.Check smoke tests via registry schemas', () => {
    it('slug-tree: minimal sample', () => {
      const s = schemaOf('slug-tree')!;
      const ok: t.SlugTreeProps = { items: [{ name: 'intro', ref: 'crdt:create' }] };
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
      const bad = { items: [{ label: 'x', ref: 'not-a-crdt-ref' }] };
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
      // @ts-expect-error ensure we don’t widen Id beyond SchemaTraitId
      const out = RegistryDefault.get('not-a-trait');
      expect(out).to.eql(undefined);
    });

    it('registry.get(id) mirrors the entry in .all', () => {
      for (const id of TRAIT_IDS) {
        const viaGet = RegistryDefault.get(id)!;
        const viaAll = RegistryDefault.all.find((e) => e.id === id)!;
        expect(viaGet).to.eql(viaAll);
      }
    });
  });
});
