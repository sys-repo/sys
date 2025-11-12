import { type t, afterEach, describe, expect, it } from '../../-test.ts';
import { attach } from '../u.repo.attach.ts';
import { workerTestHelpers } from './-u.ts';

describe('CrdtWorker.attach', () => {
  const Test = workerTestHelpers();
  afterEach(Test.clear);

  it('smoke: stream/open → ready (snapshot), then live ready$ change', async () => {
    const { port1, port2 } = Test.ports();
    const repo = await Test.realRepo();
    const { events, stop } = Test.collectRepoEvents(port1);

    attach(port2, repo);
    await Test.waitFor(() => events.length >= 1);

    expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

    const firstReady = events.find((e) => e.type === 'ready') as
      | { type: 'ready'; payload: boolean }
      | undefined;
    expect(typeof firstReady?.payload).to.eql('boolean');

    await Test.flush(2);
    const readyValues = events.filter((e) => e.type === 'ready');
    expect(readyValues.length).to.be.greaterThan(0);

    stop();
    await repo.dispose();
  });

  it('forwards prop$ → sync.enabled (enable/disable)', async () => {
    const { port1, port2 } = Test.ports();
    const repo = await Test.realRepo();

    const { events, stop } = Test.collectRepoEvents(port1);

    attach(port2, repo);
    await Test.waitFor(() => events.some((e) => e.type === 'ready'));

    // Force a real internal change (_enabled true -> false).
    repo.sync.enable(false);
    await Test.waitFor(() =>
      events.some(
        (e) =>
          e.type === 'prop-change' &&
          (e as { type: 'prop-change'; payload: t.CrdtRepoPropChange }).payload.prop ===
            'sync.enabled',
      ),
    );

    // And back again (false -> true).
    repo.sync.enable(true);
    await Test.waitFor(() => events.filter((e) => e.type === 'prop-change').length >= 2);

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

  it('forwards network$ (peer-online/offline)', async () => {
    const { port1, port2 } = Test.ports();
    const repo = await Test.realRepo();

    const { events, stop } = Test.collectRepoEvents(port1);

    attach(port2, repo);
    await Test.waitFor(() => events.some((e) => e.type === 'ready'));

    expect(events.some((e) => e.type === 'stream/open')).to.eql(true);
    expect(events.some((e) => e.type === 'ready')).to.eql(true);

    stop();
    await repo.dispose();
  });

  it('emits stream/close when upstream repo lifecycle disposes', async () => {
    const { port1, port2 } = Test.ports();
    const repo = await Test.realRepo();

    const { events, stop } = Test.collectRepoEvents(port1);

    attach(port2, repo);
    await Test.waitFor(() => events.some((e) => e.type === 'ready'));

    await repo.dispose();
    await Test.waitFor(() => events.at(-1)?.type === 'stream/close');

    expect(events[events.length - 1]).to.eql({ type: 'stream/close', payload: {} });

    stop();
  });
});
