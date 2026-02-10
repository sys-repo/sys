import { describe, expect, it } from '../../../-test.ts';
import { type t, Effect, Immutable, Player } from '../common.ts';
import { attachPlaybackDriverEffect } from './mod.ts';
import type { PlaybackEffectAdapter, SlugPlaybackRuntimeState } from './t.ts';

describe('controller: attachPlaybackDriverEffect', () => {
  type State = { playback?: SlugPlaybackRuntimeState };
  type Fixture = {
    readonly adapter: PlaybackEffectAdapter;
    readonly controller: t.EffectController<State>;
  };

  const createFixture = (): Fixture => {
    const ref = Immutable.clonerRef<State>({});
    const controller = Effect.Controller.create({ ref });
    const adapter: PlaybackEffectAdapter = {
      disposed: controller.disposed,
      dispose$: controller.dispose$,
      current: () => controller.current().playback,
      onChange: (fn) => controller.onChange((state) => fn(state.playback)),
      next: (patch) =>
        controller.next({ playback: { ...(controller.current().playback ?? {}), ...patch } }),
    };
    return { adapter, controller };
  };

  const createTestDecks = () => Player.Video.Decks.create();
  const makeTestPlaybackBundle = (docid: t.StringId): t.TimecodePlaybackDriver.Wire.Bundle => {
    const spec = {
      composition: undefined,
      beats: [],
    } as unknown as t.Timecode.Playback.Spec<unknown>;

    return {
      docid,
      spec,
      resolveAsset: () => undefined,
    };
  };

  it('attaches without throwing', () => {
    const { adapter, controller } = createFixture();
    expect(() => attachPlaybackDriverEffect(adapter)).to.not.throw();
    controller.dispose();
  });

  it('populates runtime when { bundle, decks } are present', () => {
    const { adapter, controller } = createFixture();
    attachPlaybackDriverEffect(adapter);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    controller.next({ playback: { bundle, decks } });

    const state = controller.current();
    expect(state.playback?.timeline).to.exist;
    expect(state.playback?.snapshot).to.exist;
    expect(state.playback?.resolved).to.exist;
    expect(state.playback?.experience).to.exist;

    controller.dispose();
  });

  it('does not rebuild when { bundle, decks } identities are unchanged', () => {
    const { adapter, controller } = createFixture();
    attachPlaybackDriverEffect(adapter);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    controller.next({ playback: { bundle, decks } });
    const prev = controller.current().playback?.snapshot;
    expect(prev).to.exist;

    controller.next({ playback: { ...(controller.current().playback ?? {}), bundle, decks } });
    const next = controller.current().playback?.snapshot;
    expect(next).to.equal(prev);

    controller.dispose();
  });

  it('tears down runtime when bundle or decks become missing', () => {
    const { adapter, controller } = createFixture();
    attachPlaybackDriverEffect(adapter);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    controller.next({ playback: { bundle, decks } });
    expect(controller.current().playback?.timeline).to.exist;
    expect(controller.current().playback?.snapshot).to.exist;

    // Remove one required input → runtime clears.
    controller.next({ playback: { bundle: undefined, decks } });
    expect(controller.current().playback?.timeline).to.equal(undefined);
    expect(controller.current().playback?.snapshot).to.equal(undefined);
    expect(controller.current().playback?.resolved).to.equal(undefined);
    expect(controller.current().playback?.experience).to.equal(undefined);

    controller.dispose();
  });

  it('rebuilds snapshot when bundle changes', () => {
    const { adapter, controller } = createFixture();
    attachPlaybackDriverEffect(adapter);

    const decks = createTestDecks();
    const bundleA = makeTestPlaybackBundle('doc:1' as any);
    const bundleB = makeTestPlaybackBundle('doc:2' as any);

    controller.next({ playback: { bundle: bundleA, decks } });
    const first = controller.current().playback?.snapshot;
    expect(first).to.exist;

    controller.next({ playback: { bundle: bundleB, decks } });
    const second = controller.current().playback?.snapshot;
    expect(second).to.exist;
    expect(second).to.not.equal(first);

    controller.dispose();
  });
});
