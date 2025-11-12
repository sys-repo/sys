import { type t, afterEach, describe, expect, it } from '../../-test.ts';
import { attach } from '../u.repo.attach.ts';
import { Wait, workerTestHelpers } from './-u.ts';

describe('CrdtWorker.attach', () => {
  const Test = workerTestHelpers();
  afterEach(Test.clearPorts);

  it('smoke: stream/open → ready (snapshot), then live ready$ change', async () => {
    const { port1, port2 } = Test.makePorts();
    const repo = Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);
    expect(repo.ready).to.eql(false);

    attach(port2, repo);
    await Wait.waitFor(() => events.length >= 1);

    expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

    const ready = events.filter((e) => e.type === 'ready');
    expect(ready.map((e) => e.payload.ready)).to.eql([false, false, true]);
    expect(repo.ready).to.eql(true); // sanity (real repo)

    stop();
    await repo.dispose();
  });

  it('forwards prop$ → sync.enabled (enable/disable)', async () => {
    const { port1, port2 } = Test.makePorts();
    const repo = Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);

    attach(port2, repo);
    await Wait.waitFor(() => events.some((e) => e.type === 'ready'));

    // Force a real internal change (_enabled true -> false).
    repo.sync.enable(false);
    await Wait.waitFor(() => {
      return events.some((e) => {
        return e.type === 'prop-change' ? e.payload.prop === 'sync.enabled' : false;
      });
    });

    // And back again (false -> true).
    repo.sync.enable(true);
    await Wait.waitFor(() => events.filter((e) => e.type === 'prop-change').length >= 2);

    const last = events
      .filter((e) => e.type === 'prop-change')
      .map((e) => e as { type: 'prop-change'; payload: t.CrdtRepoPropChange })
      .at(-1)!;

    expect(last.payload.prop).to.eql('sync.enabled');

    // With no adapters, the public getter is defined to be false.
    // Event payload mirrors the public props surface.
    expect(repo.sync.urls.length).to.eql(0);
    expect(repo.sync.enabled).to.eql(false);
    expect(last.payload.after.sync.enabled).to.eql(repo.sync.enabled);

    stop();
    await repo.dispose();
  });


  it('emits stream/close when upstream repo lifecycle disposes', async () => {
    const { port1, port2 } = Test.makePorts();
    const { events, stop } = Test.collectRepoEvents(port1);
    const repo = Test.realRepo();

    attach(port2, repo);
    await Wait.waitFor(() => events.some((e) => e.type === 'ready'));
    await repo.dispose();
    await Wait.waitFor(() => events.at(-1)?.type === 'stream/close');

    expect(events[events.length - 1]).to.eql({ type: 'stream/close', payload: {} });
    stop();
  });
});
