import { type t, describe, expect, expectTypeOf, it, Value } from '../../-test.ts';
import { VideoPlayerPropsSchema } from '../schema.traits/mod.ts';
import { TraitRegistryDefault } from './m.RegistryDefault.ts';
import { makeRegistry } from './u.ts';

describe('TraitRegistry (default)', () => {
  it('exposes the seeded ids in stable order', () => {
    const ids = TraitRegistryDefault.all.map((d) => d.id);
    expect(ids).to.eql(['video-player', 'video-recorder']);
  });

  it('get(id) returns entries; unknown returns <undefined>', () => {
    const a = TraitRegistryDefault.get('video-player');
    const b = TraitRegistryDefault.get('video-recorder');
    const none = TraitRegistryDefault.get('nope' as any);
    expect(!!a && !!b).to.eql(true);
    expect(none).to.eql(undefined);
  });

  it('prop-schemas accept minimal { name }', () => {
    const player = TraitRegistryDefault.get('video-player')!;
    const recorder = TraitRegistryDefault.get('video-recorder')!;
    expect(Value.Check(player.propsSchema, { name: 'Player A' })).to.eql(true);
    expect(Value.Check(recorder.propsSchema, { name: 'Recorder A' })).to.eql(true);
  });

  it('prop-schemas reject empty name', () => {
    const player = TraitRegistryDefault.get('video-player')!;
    const recorder = TraitRegistryDefault.get('video-recorder')!;
    expect(Value.Check(player.propsSchema, { name: '' })).to.eql(false);
    expect(Value.Check(recorder.propsSchema, { name: '' })).to.eql(false);
  });

  it('ids are unique (dev sanity)', () => {
    const ids = TraitRegistryDefault.all.map((d) => d.id);
    const unique = new Set(ids);
    expect(unique.size).to.eql(ids.length);
  });

  it('is strongly typed', () => {
    type Id = Parameters<typeof TraitRegistryDefault.get>[0];

    // Compile-time assertion (pass a dummy value to satisfy the signature)
    expectTypeOf<Id>(undefined as unknown as Id).toEqualTypeOf<'video-player' | 'video-recorder'>();

    // Runtime usage checks (type-checked at compile time):
    TraitRegistryDefault.get('video-player');
    TraitRegistryDefault.get('video-recorder');

    // @ts-expect-error - unknown id should not be allowed:
    TraitRegistryDefault.get('nope');
  });

  it('guard: throws on duplicate ids', () => {
    const dup = [
      { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
      { id: 'video-player', propsSchema: VideoPlayerPropsSchema },
    ] as const;
    expect(() => makeRegistry(dup as any)).to.throw();
  });
});
