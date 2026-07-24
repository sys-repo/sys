import { describe, expect, it, type t } from '../../../-test.ts';
import { createEvents } from '../u.events.ts';

describe('Cli.Screen.events', () => {
  it('forwards measured resize notifications with before and after snapshots', () => {
    let current: t.CliScreenSize = { width: 80, height: 24 };
    let notify = () => {};
    const received: t.CliScreenSizeChanged[] = [];
    const events = createEvents({
      readSize: () => current,
      observeResize(handler) {
        notify = handler;
        return () => {};
      },
    });
    events.resize$.subscribe((event) => received.push(event));

    current = { width: 120, height: 40 };
    notify();
    current = { width: 100, height: 30 };
    notify();

    expect(received).to.eql([
      {
        kind: 'size:changed',
        before: { width: 80, height: 24 },
        after: { width: 120, height: 40 },
      },
      {
        kind: 'size:changed',
        before: { width: 120, height: 40 },
        after: { width: 100, height: 30 },
      },
    ]);

    events.dispose();
  });

  it('attaches once and removes the injected listener once on disposal', () => {
    let attached = 0;
    let removed = 0;
    let completed = 0;
    const events = createEvents({
      readSize: () => ({ width: 80, height: 24 }),
      observeResize: () => {
        attached += 1;
        return () => removed += 1;
      },
    });
    events.$.subscribe({ complete: () => completed += 1 });

    events.dispose();
    events.dispose();

    expect(attached).to.eql(1);
    expect(removed).to.eql(1);
    expect(completed).to.eql(1);
  });
});
