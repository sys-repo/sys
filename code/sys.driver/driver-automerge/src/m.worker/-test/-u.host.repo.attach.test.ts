import { type t, afterEach, describe, expect, it, Schedule } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { createTestHelpers } from './u.ts';

describe('CrdtWorker.Host.attach', { sanitizeResources: false, sanitizeOps: false }, () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  it('forwards prop$ → sync.enabled (enable/disable)', async () => {
    const { port1, port2 } = Test.makePorts();
    const repo = Test.realRepo({ network: true });
    const { events, stop } = Test.collectRepoEvents(port1);

    CrdtWorker.Host.attach(port2, repo);

    // Schedule for initial snapshot over the wire.
    await Schedule.waitFor(() => events.some((e) => e.type === 'props/snapshot'));

    // Networked repo: enabled should be boolean (not null).
    const initial = repo.sync.enabled;
    expect(initial).to.not.eql(null);

    /**
     * Disable sync: true → false (or false → false if already disabled).
     * Expect a props/change event for sync.enabled.
     */
    repo.sync.enable(false);
    await Schedule.waitFor(() =>
      events.some(
        (e) =>
          e.type === 'props/change' &&
          e.payload.prop === 'sync.enabled' &&
          e.payload.after.sync.enabled === false,
      ),
    );

    /**
     * Enable sync: false → true.
     * Expect a second props/change event for sync.enabled.
     */
    repo.sync.enable(true);
    await Schedule.waitFor(
      () =>
        events.filter(
          (e) =>
            e.type === 'props/change' &&
            e.payload.prop === 'sync.enabled' &&
            e.payload.after.sync.enabled === true,
        ).length >= 1,
    );

    const last = events
      .filter((e) => e.type === 'props/change')
      .map((e) => e as { type: 'props/change'; payload: t.CrdtRepoPropChange })
      .at(-1)!;

    expect(last.payload.prop).to.eql('sync.enabled');

    // Event payload mirrors the public props surface (boolean for networked repos).
    expect(typeof repo.sync.enabled).to.eql('boolean');
    expect(last.payload.after.sync.enabled).to.eql(repo.sync.enabled);

    stop();
    await repo.dispose();
  });

  it('emits stream/close when upstream repo lifecycle disposes', async () => {
    const { port1, port2 } = Test.makePorts();
    const { events, stop } = Test.collectRepoEvents(port1);
    const repo = Test.realRepo();

    CrdtWorker.Host.attach(port2, repo);

    // Ensure the stream is open before disposing.
    await Schedule.waitFor(() => events.some((e) => e.type === 'stream/open'));
    await repo.dispose();
    await Schedule.waitFor(() => events.at(-1)?.type === 'stream/close');

    expect(events[events.length - 1]).to.eql({ type: 'stream/close', payload: {} });
    stop();
  });

  it('emits props/snapshot with real id, and stream/open is first', async () => {
    const { port1, port2 } = Test.makePorts();
    const real = Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);

    CrdtWorker.Host.attach(port2, real);
    await Schedule.waitFor(() => events.some((e) => e.type === 'props/snapshot'));

    type T = Extract<t.WireRepoEventPayload, { type: 'props/snapshot' }>;
    const snap = events.find((e) => e.type === 'props/snapshot') as T | undefined;

    expect(snap?.payload.id.instance).to.eql(real.id.instance);
    expect(snap?.payload.id.peer).to.eql(real.id.peer);

    // Ordering: stream/open must be first.
    expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

    stop();
    await real.dispose();
  });

  it('smoke: stream/open → status snapshot, then status.ready change', async () => {
    const { port1, port2 } = Test.makePorts();
    const repo = Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);

    expect(repo.status.ready).to.eql(false);

    CrdtWorker.Host.attach(port2, repo);

    // Schedule until we have stream/open + an initial snapshot.
    await Schedule.waitFor(
      () =>
        events.some((e) => e.type === 'stream/open') &&
        events.some((e) => e.type === 'props/snapshot'),
    );

    expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

    type Snap = Extract<t.WireRepoEventPayload, { type: 'props/snapshot' }>;
    const snapshot = events.find((e) => e.type === 'props/snapshot') as Snap | undefined;
    expect(snapshot?.payload.status.ready).to.eql(false);

    // Drive the real repo to "ready" and expect a status prop change over the wire.
    await repo.whenReady();

    await Schedule.waitFor(() =>
      events.some(
        (e) =>
          e.type === 'props/change' &&
          e.payload.prop === 'status' &&
          e.payload.after.status.ready === true,
      ),
    );

    type Change = Extract<t.WireRepoEventPayload, { type: 'props/change' }>;
    const statusEvents = events.filter(
      (e): e is Change =>
        e.type === 'props/change' &&
        e.payload.prop === 'status' &&
        e.payload.after.status.ready === true,
    );

    const first = statusEvents[0];
    expect(first.payload.before.status.ready).to.eql(false);
    expect(first.payload.after.status.ready).to.eql(true);
    expect(repo.status.ready).to.eql(true);

    stop();
    await repo.dispose();
  });

  it('smoke: networked repo mutation → props/change over port', async () => {
    const { port1, port2 } = Test.makePorts();
    const real = Test.realRepo({ network: true }); // adapter → sync.enabled = true
    const { events, stop } = Test.collectRepoEvents(port1);

    // Wire up the worker boundary.
    CrdtWorker.Host.attach(port2, real);

    // Schedule until we know the stream is open and we have an initial snapshot.
    await Schedule.waitFor(
      () =>
        events.some((e) => e.type === 'stream/open') &&
        events.some((e) => e.type === 'props/snapshot'),
    );

    // Sanity: initial network state.
    expect(real.sync.enabled).to.eql(true);

    // Trigger a real change on the real repo: true → false.
    real.sync.enable(false);

    // Schedule until we see the sync.enabled change over the wire.
    await Schedule.waitFor(() =>
      events.some(
        (e) =>
          e.type === 'props/change' &&
          e.payload.prop === 'sync.enabled' &&
          e.payload.after.sync.enabled === false,
      ),
    );

    type Change = Extract<t.WireRepoEventPayload, { type: 'props/change' }>;
    const syncEvents = events.filter(
      (e): e is Change => e.type === 'props/change' && e.payload.prop === 'sync.enabled',
    );
    const last = syncEvents.at(-1)!;

    // Payload reflects the true → false edge.
    expect(last.payload.before.sync.enabled).to.eql(true);
    expect(last.payload.after.sync.enabled).to.eql(false);

    // Arrays in payload are defensively cloned (no shared refs in the change).
    expect(last.payload.after.sync.peers).to.not.equal(last.payload.before.sync.peers);
    expect(last.payload.after.sync.urls).to.not.equal(last.payload.before.sync.urls);

    stop();
    await real.dispose();
  });
});
