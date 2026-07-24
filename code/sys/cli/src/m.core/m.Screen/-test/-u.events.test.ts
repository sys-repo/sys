import { describe, expect, it, Num, Rx, type t } from '../../../-test.ts';
import { createEvents } from '../u.events.ts';
import type { ScreenMeasurement } from '../u.measure.ts';

const attached = (stop: () => void = () => {}) => ({ kind: 'attached', stop }) as const;

describe('Cli.Screen.events', () => {
  it('attaches before measuring and emits exact width and height transitions', () => {
    let current: ScreenMeasurement = { width: 80, height: 24 };
    let notify = () => {};
    const order: string[] = [];
    const received: t.CliScreenSizeChanged[] = [];
    const events = createEvents({
      measure() {
        order.push('measure');
        return current;
      },
      observeResize(handler) {
        order.push('attach');
        notify = handler;
        return attached();
      },
    });
    events.resize$.subscribe((event) => received.push(event));

    current = { width: 120, height: 24 };
    notify();
    current = { width: 120, height: 40 };
    notify();

    expect(order.slice(0, 2)).to.eql(['attach', 'measure']);
    expect(received).to.eql([
      {
        kind: 'size:changed',
        before: { width: 80, height: 24 },
        after: { width: 120, height: 24 },
      },
      {
        kind: 'size:changed',
        before: { width: 120, height: 24 },
        after: { width: 120, height: 40 },
      },
    ]);

    events.dispose();
  });

  it('ignores unavailable, partial, invalid, and repeated measurements', () => {
    let current: ScreenMeasurement | undefined;
    let notify = () => {};
    const received: t.CliScreenSizeChanged[] = [];
    const events = createEvents({
      measure: () => current,
      observeResize(handler) {
        notify = handler;
        return attached();
      },
    });
    events.resize$.subscribe((event) => received.push(event));

    current = { width: 80 };
    notify();
    current = { width: 0, height: 24 };
    notify();
    current = { width: Num.INFINITY, height: 24 };
    notify();
    current = { width: 80, height: 24 };
    notify(); // First complete measurement establishes the baseline.
    notify(); // Repeated measurement is not a transition.
    current = undefined;
    notify(); // Unavailable measurement does not replace the baseline.
    current = { width: 100, height: 30 };
    notify();

    expect(received).to.eql([
      {
        kind: 'size:changed',
        before: { width: 80, height: 24 },
        after: { width: 100, height: 30 },
      },
    ]);
    events.dispose();
  });

  it('updates the accepted size before delivering re-entrant notifications', () => {
    let current: ScreenMeasurement = { width: 80, height: 24 };
    let notify = () => {};
    const received: t.CliScreenSizeChanged[] = [];
    const events = createEvents({
      measure: () => current,
      observeResize(handler) {
        notify = handler;
        return attached();
      },
    });
    events.resize$.subscribe((event) => {
      received.push(event);
      if (event.after.width === 100) {
        current = { width: 120, height: 24 };
        notify();
      }
    });

    current = { width: 100, height: 24 };
    notify();

    expect(received).to.eql([
      {
        kind: 'size:changed',
        before: { width: 80, height: 24 },
        after: { width: 100, height: 24 },
      },
      {
        kind: 'size:changed',
        before: { width: 100, height: 24 },
        after: { width: 120, height: 24 },
      },
    ]);
    events.dispose();
  });

  it('does not attach for already-terminated stateful lifetimes', () => {
    const disposed = Rx.lifecycle();
    disposed.dispose();
    const aborted = new AbortController();
    aborted.abort('already aborted');

    const lifetimes: t.UntilInput[] = [
      disposed,
      aborted.signal,
      [undefined, [disposed]],
    ];

    for (const until of lifetimes) {
      let attachedCount = 0;
      let completed = 0;
      const events = createEvents(
        {
          measure: () => ({ width: 80, height: 24 }),
          observeResize: () => {
            attachedCount += 1;
            return attached();
          },
        },
        until,
      );
      events.$.subscribe({ complete: () => completed += 1 });

      expect(events.disposed).to.eql(true);
      expect(attachedCount).to.eql(0);
      expect(completed).to.eql(1);
    }
  });

  it('does not attach after a synchronous upstream termination', () => {
    let attachedCount = 0;
    const events = createEvents(
      {
        measure: () => ({ width: 80, height: 24 }),
        observeResize: () => {
          attachedCount += 1;
          return attached();
        },
      },
      Rx.of({ reason: 'already done' }),
    );

    expect(events.disposed).to.eql(true);
    expect(attachedCount).to.eql(0);
  });

  it('releases a listener returned after synchronous disposal during attachment', () => {
    const until$ = Rx.subject<t.DisposeEvent>();
    let removed = 0;
    const events = createEvents(
      {
        measure: () => ({ width: 80, height: 24 }),
        observeResize: () => {
          until$.next({ reason: 'during attachment' });
          return attached(() => removed += 1);
        },
      },
      until$,
    );

    events.dispose();

    expect(events.disposed).to.eql(true);
    expect(removed).to.eql(1);
  });

  it('removes once and completes early and late subscribers', () => {
    let removed = 0;
    let eventsCompletedEarly = 0;
    let eventsCompletedLate = 0;
    let resizeCompletedEarly = 0;
    let resizeCompletedLate = 0;
    const events = createEvents({
      measure: () => ({ width: 80, height: 24 }),
      observeResize: () => attached(() => removed += 1),
    });
    events.$.subscribe({ complete: () => eventsCompletedEarly += 1 });
    events.resize$.subscribe({ complete: () => resizeCompletedEarly += 1 });

    events.dispose();
    events.dispose();
    events.$.subscribe({ complete: () => eventsCompletedLate += 1 });
    events.resize$.subscribe({ complete: () => resizeCompletedLate += 1 });

    expect(removed).to.eql(1);
    expect(eventsCompletedEarly).to.eql(1);
    expect(eventsCompletedLate).to.eql(1);
    expect(resizeCompletedEarly).to.eql(1);
    expect(resizeCompletedLate).to.eql(1);
  });

  it('releases once on upstream disposal', () => {
    const until = Rx.lifecycle();
    let removed = 0;
    const events = createEvents(
      {
        measure: () => ({ width: 80, height: 24 }),
        observeResize: () => attached(() => removed += 1),
      },
      until,
    );

    until.dispose();
    events.dispose();

    expect(events.disposed).to.eql(true);
    expect(removed).to.eql(1);
  });

  it('does not measure from a queued notification after disposal', () => {
    let measured = 0;
    let notify = () => {};
    const events = createEvents({
      measure: () => {
        measured += 1;
        return { width: 80, height: 24 };
      },
      observeResize(handler) {
        notify = handler;
        return attached();
      },
    });

    events.dispose();
    notify();

    expect(measured).to.eql(1);
  });

  it('returns an inert disposable handle when observation is unsupported', () => {
    let measured = 0;
    let completed = 0;
    const events = createEvents({
      measure: () => {
        measured += 1;
        return { width: 80, height: 24 };
      },
      observeResize: () => ({ kind: 'unsupported' }),
    });
    events.$.subscribe({ complete: () => completed += 1 });

    expect(events.disposed).to.eql(false);
    expect(measured).to.eql(0);

    events.dispose();

    expect(events.disposed).to.eql(true);
    expect(completed).to.eql(1);
  });

  it('releases upstream ownership and rethrows registration failures', () => {
    const error = new Error('registration failed');
    let upstreamReleased = 0;
    const until$ = new Rx.Observable<t.DisposeEvent>(() => {
      return () => upstreamReleased += 1;
    });

    expect(() =>
      createEvents(
        {
          measure: () => ({ width: 80, height: 24 }),
          observeResize: () => {
            throw error;
          },
        },
        until$,
      )
    ).to.throw(error);
    expect(upstreamReleased).to.eql(1);
  });

  it('releases an attached listener when initial measurement fails', () => {
    const error = new Error('measurement failed');
    let removed = 0;

    expect(() =>
      createEvents({
        measure: () => {
          throw error;
        },
        observeResize: () => attached(() => removed += 1),
      })
    ).to.throw(error);
    expect(removed).to.eql(1);
  });
});
