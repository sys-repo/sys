import { describe, expect, it } from '../../../-test.ts';
import { attachPlaybackDriverEffect } from './mod.ts';
import {
  createTestController,
  createTestDecks,
  makeTestPlaybackBundle,
} from '../../ui.SlugPlaybackDriver/-test/u.fixture.ts';

describe('controller: attachPlaybackDriverEffect', () => {
  it('attaches without throwing', () => {
    const ctrl = createTestController();
    expect(() => attachPlaybackDriverEffect(ctrl)).to.not.throw();
    ctrl.dispose();
  });

  it('populates runtime when { bundle, decks } are present', () => {
    const ctrl = createTestController();
    attachPlaybackDriverEffect(ctrl);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    ctrl.next({ playback: { bundle, decks } });

    const state = ctrl.current();
    expect(state.playback?.timeline).to.exist;
    expect(state.playback?.snapshot).to.exist;
    expect(state.playback?.resolved).to.exist;
    expect(state.playback?.experience).to.exist;

    ctrl.dispose();
  });

  it('does not rebuild when { bundle, decks } identities are unchanged', () => {
    const ctrl = createTestController();
    attachPlaybackDriverEffect(ctrl);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    ctrl.next({ playback: { bundle, decks } });
    const prev = ctrl.current().playback?.snapshot;
    expect(prev).to.exist;

    ctrl.next({ playback: { ...(ctrl.current().playback ?? {}), bundle, decks } });
    const next = ctrl.current().playback?.snapshot;
    expect(next).to.equal(prev);

    ctrl.dispose();
  });

  it('tears down runtime when bundle or decks become missing', () => {
    const ctrl = createTestController();
    attachPlaybackDriverEffect(ctrl);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    ctrl.next({ playback: { bundle, decks } });
    expect(ctrl.current().playback?.timeline).to.exist;
    expect(ctrl.current().playback?.snapshot).to.exist;

    // Remove one required input → runtime clears.
    ctrl.next({ playback: { bundle: undefined, decks } });
    expect(ctrl.current().playback?.timeline).to.equal(undefined);
    expect(ctrl.current().playback?.snapshot).to.equal(undefined);
    expect(ctrl.current().playback?.resolved).to.equal(undefined);
    expect(ctrl.current().playback?.experience).to.equal(undefined);

    ctrl.dispose();
  });

  it('rebuilds snapshot when bundle changes', () => {
    const ctrl = createTestController();
    attachPlaybackDriverEffect(ctrl);

    const decks = createTestDecks();
    const bundleA = makeTestPlaybackBundle('doc:1' as any);
    const bundleB = makeTestPlaybackBundle('doc:2' as any);

    ctrl.next({ playback: { bundle: bundleA, decks } });
    const first = ctrl.current().playback?.snapshot;
    expect(first).to.exist;

    ctrl.next({ playback: { bundle: bundleB, decks } });
    const second = ctrl.current().playback?.snapshot;
    expect(second).to.exist;
    expect(second).to.not.equal(first);

    ctrl.dispose();
  });
});
