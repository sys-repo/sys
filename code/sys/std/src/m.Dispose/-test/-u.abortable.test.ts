import { describe, Dispose, expect, it, Rx, Schedule } from './common.ts';

describe('Dispose.abortable', () => {
  it('constructs a controller-backed lifecycle', () => {
    const abortable = Dispose.abortable();

    expect(abortable.disposed).to.eql(false);
    expect(abortable.signal.aborted).to.eql(false);
    expect(abortable.controller).to.be.an.instanceOf(AbortController);
    expect(abortable.signal).to.be.an.instanceOf(AbortSignal);
    expect(Symbol.asyncDispose in abortable).to.eql(false);
  });

  it('using → aborts through native lifecycle authority', () => {
    let signal: AbortSignal | undefined;
    {
      using abortable = Dispose.abortable();
      signal = abortable.signal;
      expect(signal.aborted).to.eql(false);
    }

    expect(signal?.aborted).to.eql(true);
  });

  it('synchronous until → aborted signal and terminal state after construction', async () => {
    const abortable = Dispose.abortable(Rx.of({ reason: 'synchronous:until' }));

    expect(abortable.disposed).to.eql(false);
    expect(abortable.signal.aborted).to.eql(false);
    await Schedule.micro();

    expect(abortable.disposed).to.eql(true);
    expect(abortable.signal.aborted).to.eql(true);
    expect(abortable.signal.reason).to.eql('synchronous:until');
  });

  it('dispose → aborted signal and terminal state', () => {
    const abortable = Dispose.abortable();
    let events = 0;
    abortable.signal.addEventListener('abort', () => events++);

    abortable.dispose();

    expect(abortable.disposed).to.eql(true);
    expect(abortable.signal.aborted).to.eql(true);
    expect(events).to.eql(1);
  });

  it('repeated disposal → one abort event', () => {
    const abortable = Dispose.abortable();
    let events = 0;
    abortable.signal.addEventListener('abort', () => events++);

    abortable.dispose();
    abortable.dispose();

    expect(abortable.disposed).to.eql(true);
    expect(abortable.signal.aborted).to.eql(true);
    expect(events).to.eql(1);
  });

  it('external lifecycle → aborted signal and terminal state', () => {
    const { dispose, dispose$ } = Rx.lifecycle();
    const abortable = Dispose.abortable(dispose$);

    expect(abortable.disposed).to.eql(false);
    expect(abortable.signal.aborted).to.eql(false);

    dispose();

    expect(abortable.disposed).to.eql(true);
    expect(abortable.signal.aborted).to.eql(true);
  });

  it('external and local disposal → one abort event', () => {
    const { dispose, dispose$ } = Rx.lifecycle();
    const abortable = Dispose.abortable(dispose$);
    let events = 0;
    abortable.signal.addEventListener('abort', () => events++);

    dispose();
    abortable.dispose();
    abortable.controller.abort();

    expect(events).to.eql(1);
    expect(abortable.signal.aborted).to.eql(true);
  });

  describe('reason propagation', () => {
    it('direct reason → AbortSignal.reason', () => {
      const abortable = Dispose.abortable();
      const reason = 'direct:reason';
      abortable.dispose(reason);

      expect(abortable.disposed).to.eql(true);
      expect(abortable.signal.aborted).to.eql(true);
      expect(abortable.signal.reason).to.eql(reason);
    });

    it('repeated disposal → first reason', () => {
      const abortable = Dispose.abortable();
      abortable.dispose('first');
      abortable.dispose('second');

      expect(abortable.signal.aborted).to.eql(true);
      expect(abortable.signal.reason).to.eql('first');
    });

    it('external lifecycle reason → AbortSignal.reason', () => {
      const upstream = Dispose.lifecycle();
      const abortable = Dispose.abortable(upstream.dispose$);
      const reason = 'upstream:dispose';

      upstream.dispose(reason);

      expect(abortable.disposed).to.eql(true);
      expect(abortable.signal.aborted).to.eql(true);
      expect(abortable.signal.reason).to.eql(reason);
    });

    it('AbortSignal reason → AbortSignal.reason', async () => {
      const controller = new AbortController();
      const abortable = Dispose.abortable(controller.signal);

      controller.abort('upstream:abort');
      await Schedule.micro();

      expect(abortable.disposed).to.eql(true);
      expect(abortable.signal.aborted).to.eql(true);
      expect(abortable.signal.reason).to.eql('upstream:abort');
    });

    it('pre-aborted signal reason → AbortSignal.reason', async () => {
      const controller = new AbortController();
      controller.abort('upstream:pre-abort');

      const abortable = Dispose.abortable(controller.signal);
      expect(abortable.signal.aborted).to.eql(false);

      await Schedule.micro();

      expect(abortable.disposed).to.eql(true);
      expect(abortable.signal.aborted).to.eql(true);
      expect(abortable.signal.reason).to.eql('upstream:pre-abort');
    });

    it('Error reason → AbortSignal.reason identity', () => {
      const abortable = Dispose.abortable();
      const error = new Error('boom');
      abortable.dispose(error);

      expect(abortable.signal.aborted).to.eql(true);
      expect(abortable.signal.reason).to.equal(error);
    });
  });
});
