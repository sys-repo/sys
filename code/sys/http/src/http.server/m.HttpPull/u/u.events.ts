import { Rx, type t } from '../common.ts';

type Event = t.HttpPull.Event.Any;
type EventWaiter = (result: IteratorResult<Event>) => void;

type EventQueue = AsyncIterable<Event> & {
  readonly push: (event: Event) => void;
  readonly close: () => void;
};

/**
 * Create the operation's bounded, single-consumer event queue.
 * Progress is coalesced by input. Under pressure, progress and start events yield before terminal
 * events; if terminal events alone exceed the bound, the oldest retained event is evicted. Complete
 * terminal truth remains in `operation.done`, never in this lossy view.
 */
export function eventQueue(limit: number): EventQueue {
  const buffer: Event[] = [];
  const waiters: EventWaiter[] = [];
  let closed = false;

  const push = (event: Event) => {
    if (closed) return;

    const waiter = waiters.shift();
    if (waiter) {
      waiter({ value: event, done: false });
      return;
    }

    if (event.kind === 'progress') {
      const matching = buffer.findIndex((item) =>
        item.kind === 'progress' && item.index === event.index
      );
      if (matching >= 0) buffer[matching] = event;
      else if (buffer.length < limit) buffer.push(event);
      return;
    }

    if (buffer.length >= limit) {
      const progress = buffer.findIndex((item) => item.kind === 'progress');
      if (progress >= 0) buffer.splice(progress, 1);
      else if (event.kind === 'start') return;
      else {
        const start = buffer.findIndex((item) => item.kind === 'start');
        buffer.splice(start >= 0 ? start : 0, 1);
      }
    }
    buffer.push(event);
  };

  const close = () => {
    if (closed) return;
    closed = true;
    while (waiters.length) waiters.shift()!({ value: undefined, done: true });
  };

  const iterator: AsyncIterator<Event> = {
    next() {
      return new Promise((resolve) => {
        if (buffer.length) resolve({ value: buffer.shift()!, done: false });
        else if (closed) resolve({ value: undefined, done: true });
        else waiters.push(resolve);
      });
    },
  };

  return {
    push,
    close,
    [Symbol.asyncIterator]: () => iterator,
  };
}

/**
 * Create a hot, non-replaying observable view.
 * Its lifecycle owns only this subscription, never the pull operation or sibling views.
 */
export function eventView<T>(
  source$: t.Observable<T>,
  until?: t.UntilInput,
): t.Lifecycle & { readonly $: t.Observable<T> } {
  const life = Rx.lifecycle(until);
  const view$ = Rx.subject<T>();
  const subscription = source$.subscribe({
    next: (event) => view$.next(event),
    error: (error) => view$.error(error),
    complete: () => {
      view$.complete();
      if (!life.disposed) life.dispose('pull:complete');
    },
  });
  life.dispose$.subscribe(() => {
    subscription.unsubscribe();
    view$.complete();
  });
  return Rx.toLifecycle(life, { $: view$.asObservable() });
}
