import { describe, expect, it } from '../../../-test.ts';
import { attachPlaybackDriverEffect } from '../u.attachPlaybackDriverEffect.ts';
import { createTestController, createTestDecks, makeTestPlaybackBundle } from './u.fixture.ts';

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

    ctrl.next({ bundle, decks });

    const state = ctrl.current();
    expect(state.timeline).to.exist;
    expect(state.snapshot).to.exist;
    expect(state.resolved).to.exist;
    expect(state.experience).to.exist;

    ctrl.dispose();
  });

  it('does not rebuild when { bundle, decks } identities are unchanged', () => {
    const ctrl = createTestController();
    attachPlaybackDriverEffect(ctrl);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    ctrl.next({ bundle, decks });
    const prev = ctrl.current().snapshot;
    expect(prev).to.exist;

    ctrl.next({ bundle, decks });
    const next = ctrl.current().snapshot;
    expect(next).to.equal(prev);

    ctrl.dispose();
  });

  it('tears down runtime when bundle or decks become missing', () => {
    const ctrl = createTestController();
    attachPlaybackDriverEffect(ctrl);

    const bundle = makeTestPlaybackBundle('doc:1' as any);
    const decks = createTestDecks();

    ctrl.next({ bundle, decks });
    expect(ctrl.current().timeline).to.exist;
    expect(ctrl.current().snapshot).to.exist;

    // Remove one required input → runtime clears.
    ctrl.next({ bundle: undefined });
    expect(ctrl.current().timeline).to.equal(undefined);
    expect(ctrl.current().snapshot).to.equal(undefined);
    expect(ctrl.current().resolved).to.equal(undefined);
    expect(ctrl.current().experience).to.equal(undefined);

    ctrl.dispose();
  });

  it('rebuilds snapshot when bundle changes', () => {
    const ctrl = createTestController();
    attachPlaybackDriverEffect(ctrl);

    const decks = createTestDecks();
    const bundleA = makeTestPlaybackBundle('doc:1' as any);
    const bundleB = makeTestPlaybackBundle('doc:2' as any);

    ctrl.next({ bundle: bundleA, decks });
    const first = ctrl.current().snapshot;
    expect(first).to.exist;

    ctrl.next({ bundle: bundleB, decks });
    const second = ctrl.current().snapshot;
    expect(second).to.exist;
    expect(second).to.not.equal(first);

    ctrl.dispose();
  });
});
