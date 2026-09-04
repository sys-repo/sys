import { describe, Dispose, expect, it, Rx, type t } from './common.ts';

describe('Dispose.done', () => {
  it('repeated calls → one event and completion', () => {
    const dispose$ = Rx.subject<t.DisposeEvent>();
    let nextCount = 0;
    let completed = false;

    dispose$.subscribe({
      next: () => nextCount++,
      complete: () => (completed = true),
    });

    Dispose.done(dispose$);
    Dispose.done(dispose$);
    Dispose.done(dispose$);

    expect(nextCount).to.eql(1);
    expect(completed).to.eql(true);
  });

  it('first reason → one emitted reason', () => {
    const dispose$ = Rx.subject<t.DisposeEvent>();
    const events: t.DisposeEvent[] = [];
    dispose$.subscribe((event) => events.push(event));

    Dispose.done(dispose$, 'a');
    Dispose.done(dispose$, 'b');

    expect(events.length).to.eql(1);
    expect(events[0].reason).to.eql('a');
  });
});
