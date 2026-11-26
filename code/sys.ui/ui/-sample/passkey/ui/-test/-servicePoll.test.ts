import { createServicePoll } from '../../ui.controller/u.servicePoll.ts';
import { describe, expect, it, type t, Time } from './common.ts';

const zero = Object.freeze({ accounts: 0, registeredPasskeys: 0, validSessions: 0 });
const fresh = Object.freeze({ accounts: 1, registeredPasskeys: 2, validSessions: 1 });

function fixture() {
  const reads: {
    signal: AbortSignal | undefined;
    reply: (value?: t.Accounts.ServiceStats) => void;
  }[] = [];
  const waits: { delay: t.Msecs; signal: AbortSignal; elapsed: () => void }[] = [];
  const poll = createServicePoll(
    (signal) => {
      const { promise, resolve } = Promise.withResolvers<t.Accounts.ServiceStats | undefined>();
      reads.push({ signal, reply: (value) => resolve(value) });
      return promise;
    },
    (delay, signal) => {
      const { promise, resolve } = Promise.withResolvers<void>();
      waits.push({ delay, signal, elapsed: resolve });
      return promise;
    },
  );
  const seen: t.Passkey.ServiceObservation[] = [];
  const stop = poll.service.subscribe(() => seen.push(poll.service.current()));
  return {
    ...poll,
    reads,
    waits,
    seen,
    [Symbol.dispose]() {
      stop();
      poll.dispose();
      for (const read of reads) read.reply();
      for (const wait of waits) wait.elapsed();
    },
  };
}

describe('passkey service poll', () => {
  it('settlement → wait five seconds before the next read; failed counts can recover', async () => {
    using a = fixture();
    a.resume();
    a.resume();
    expect(a.reads.length).to.eql(1);
    expect(a.waits).to.eql([]);

    a.reads[0].reply(zero);
    await Time.waitFor(() => a.waits.length === 1);
    expect(a.waits[0].delay).to.eql(5_000);
    expect(a.waits[0].signal).to.equal(a.reads[0].signal);
    expect(a.reads.length).to.eql(1);
    a.waits[0].elapsed();
    await Time.waitFor(() => a.reads.length === 2);

    a.reads[1].reply();
    await Time.waitFor(() => a.waits.length === 2);
    a.waits[1].elapsed();
    await Time.waitFor(() => a.reads.length === 3);
    a.reads[2].reply(fresh);
    await Time.waitFor(() => a.waits.length === 3);
    expect(a.seen).to.eql([
      { kind: 'observed', counts: zero },
      { kind: 'failed' },
      { kind: 'observed', counts: fresh },
    ]);
  });

  it('pause → abort read or wait; ignore late replies and keep owners independent', async () => {
    using a = fixture();
    using b = fixture();
    expect(Reflect.set(a.service.current(), 'kind', 'failed')).to.eql(false);
    a.resume();
    b.resume();
    a.pause();
    expect(a.reads[0].signal?.aborted).to.eql(true);
    expect(b.reads[0].signal?.aborted).to.eql(false);
    a.resume();
    expect(a.reads.length).to.eql(2);
    a.reads[1].reply(fresh);
    b.reads[0].reply(zero);
    a.reads[0].reply(zero); // The retired reader ignores its signal.
    await Time.waitFor(() => a.waits.length === 1 && b.waits.length === 1);
    expect(a.seen).to.eql([{ kind: 'observed', counts: fresh }]);
    expect(b.seen).to.eql([{ kind: 'observed', counts: zero }]);
    const observed = a.service.current();
    expect(Reflect.set(observed, 'counts', zero)).to.eql(false);
    expect(a.service.current()).to.equal(observed);
    expect(a.service.current()).to.eql({ kind: 'observed', counts: fresh });

    a.pause();
    expect(a.waits[0].signal.aborted).to.eql(true);
    a.waits[0].elapsed();
    await Time.wait(0);
    expect(a.reads.length).to.eql(2);
    expect(a.service.current()).to.equal(observed);
    a.resume();
    a.resume();
    expect(a.reads.length).to.eql(3);
    a.dispose();
    a.resume();
    expect(a.reads.length).to.eql(3);
    expect(a.reads[2].signal?.aborted).to.eql(true);
    expect(a.service.current()).to.eql({ kind: 'not-observed' });
    expect(b.waits[0].signal.aborted).to.eql(false);
    expect(b.service.current()).to.eql({ kind: 'observed', counts: zero });
  });
});
