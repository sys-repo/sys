import { type t, Rx, afterEach, describe, expect, it } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { attach } from '../u.attach.ts';
import { Wait, createTestHelpers } from './u.ts';

describe('CrdtWorker.attach', { sanitizeResources: false, sanitizeOps: false }, () => {
  const Test = createTestHelpers();
  afterEach(Test.clearPorts);

  it('API', () => {
    expect(CrdtWorker.attach).to.equal(attach);
  });

  it('forwards prop$ → sync.enabled (enable/disable)', async () => {
    const { port1, port2 } = Test.makePorts();
    const repo = Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);

    CrdtWorker.attach(port2, repo);
    await Wait.waitFor(() => events.some((e) => e.type === 'ready'));

    // Force a real internal change (_enabled true → false).
    repo.sync.enable(false);
    await Wait.waitFor(() => {
      return events.some((e) => {
        return e.type === 'props/change' ? e.payload.prop === 'sync.enabled' : false;
      });
    });

    // And back again (false → true).
    repo.sync.enable(true);
    await Wait.waitFor(() => events.filter((e) => e.type === 'props/change').length >= 2);

    const last = events
      .filter((e) => e.type === 'props/change')
      .map((e) => e as { type: 'props/change'; payload: t.CrdtRepoPropChange })
      .at(-1)!;

    expect(last.payload.prop).to.eql('sync.enabled');

    // With no adapters, the public getter is defined to be <null>.
    // Event payload mirrors the public props surface.
    expect(repo.sync.urls.length).to.eql(0);
    expect(repo.sync.enabled).to.eql(null);
    expect(last.payload.after.sync.enabled).to.eql(repo.sync.enabled);

    stop();
    await repo.dispose();
  });

  it('emits stream/close when upstream repo lifecycle disposes', async () => {
    const { port1, port2 } = Test.makePorts();
    const { events, stop } = Test.collectRepoEvents(port1);
    const repo = Test.realRepo();

    CrdtWorker.attach(port2, repo);
    await Wait.waitFor(() => events.some((e) => e.type === 'ready'));
    await repo.dispose();
    await Wait.waitFor(() => events.at(-1)?.type === 'stream/close');

    expect(events[events.length - 1]).to.eql({ type: 'stream/close', payload: {} });
    stop();
  });

  it('emits props/snapshot with real id, before ready flips', async () => {
    const { port1, port2 } = Test.makePorts();
    const real = Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);

    CrdtWorker.attach(port2, real);
    await Wait.waitFor(() => events.some((e) => e.type === 'props/snapshot'));

    type T = Extract<t.WireRepoEventPayload, { type: 'props/snapshot' }>;
    const snap = events.find((e) => e.type === 'props/snapshot') as T | undefined;

    expect(snap?.payload.id.instance).to.eql(real.id.instance);
    expect(snap?.payload.id.peer).to.eql(real.id.peer);

    // The ready edge may happen right after; we only assert ordering with stream/open before snapshot.
    expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

    stop();
    await real.dispose();
  });

  it('smoke: stream/open → ready (snapshot), then live ready$ change', async () => {
    const { port1, port2 } = Test.makePorts();
    const repo = Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);
    expect(repo.ready).to.eql(false);

    CrdtWorker.attach(port2, repo);
    await Wait.waitFor(() => events.length >= 1);

    expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

    const ready = events.filter((e) => e.type === 'ready');
    expect(ready.map((e) => e.payload.ready)).to.eql([false, false, true]);
    expect(repo.ready).to.eql(true); // sanity (real repo)

    stop();
    await repo.dispose();
  });

  it('smoke: networked repo mutation → props/change over port → client.prop$', async () => {
    const { port1, port2 } = Test.makePorts();
    const real = Test.realRepo({ network: true }); // Has network adapter → sync.enabled can be `true`.
    const client = CrdtWorker.repo(port1);

    const until = Rx.lifecycle();
    const propEvents: t.CrdtRepoPropChangeEvent['payload'][] = [];
    client.events(until).prop$.subscribe((e) => propEvents.push(e));

    // wire up the worker boundary
    CrdtWorker.attach(port2, real);

    // wait until client is ready (received snapshot/ready)
    await client.whenReady();

    // initial state: networked repo → enabled === true
    expect(real.sync.enabled).to.eql(true);
    expect(client.sync.enabled).to.eql(true);

    // cause a real change on the real repo: true → false
    real.sync.enable(false);

    // wait until we see the sync.enabled change over the wire
    await Wait.waitFor(() =>
      propEvents.some((e) => e.prop === 'sync.enabled' && e.after.sync.enabled === false),
    );

    const syncEvents = propEvents.filter((e) => e.prop === 'sync.enabled');
    const last = syncEvents.at(-1)!;

    // payload reflects the true → false edge
    expect(last.before.sync.enabled).to.eql(true);
    expect(last.after.sync.enabled).to.eql(false);

    // client’s getters mirror AFTER state
    expect(client.sync.enabled).to.eql(false);
    expect(real.sync.enabled).to.eql(false);
    expect(last.after.sync.enabled).to.eql(real.sync.enabled);

    // arrays in payload are defensively cloned (no shared refs in the change)
    expect(last.after.sync.peers).to.not.equal(last.before.sync.peers);
    expect(last.after.sync.urls).to.not.equal(last.before.sync.urls);

    until.dispose();
    await client.dispose();
    await real.dispose();
  });
});
