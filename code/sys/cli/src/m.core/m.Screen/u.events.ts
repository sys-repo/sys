import { Dispose, Is, Rx, type t } from '../common.ts';
import { ScreenMeasure, type ScreenMeasurement } from './u.measure.ts';
import { ScreenPlatform, type ScreenResizeObservation } from './u.platform.ts';

type Deps = {
  measure: () => ScreenMeasurement | undefined;
  observeResize: (handler: () => void) => ScreenResizeObservation;
};

type Subscription = { unsubscribe(): void };
type Termination = { readonly reason?: unknown };

/** Create terminal screen events over injected measurement and observation dependencies. */
export function createEvents(deps: Deps, until?: t.UntilInput): t.CliScreen.Events {
  const life = Rx.lifecycle();
  const $$ = Rx.subject<t.CliScreen.Event>();
  const $: t.Observable<t.CliScreen.Event> = $$.asObservable();
  const resize$ = $.pipe(Rx.filter((event) => event.kind === 'size:changed'));
  const api = Rx.toLifecycle<t.CliScreen.Events>(life, { $, resize$ });

  const listener = createDeferredCleanup();
  const upstream = new Set<Subscription>();
  let before: t.CliScreen.Size | undefined;

  function onDispose() {
    try {
      listener.release();
    } finally {
      for (const subscription of upstream) {
        try {
          subscription.unsubscribe();
        } catch {
          // Upstream teardown must not prevent event-stream completion.
        }
      }
      upstream.clear();
      $$.complete();
    }
  }

  life.dispose$.subscribe(onDispose);

  const measure = () => {
    if (life.disposed) return;
    const after = ScreenMeasure.size(deps.measure());
    if (life.disposed || !after) return;

    if (!before) {
      before = after;
      return;
    }
    if (wrangle.sameSize(before, after)) return;

    const event: t.CliScreen.SizeChanged = { kind: 'size:changed', before, after };
    before = after;
    $$.next(event);
  };

  const terminated = wrangle.termination(until);
  if (terminated) {
    life.dispose(terminated.reason);
  } else {
    for (const source$ of Dispose.until(until)) {
      if (life.disposed) break;
      const subscription = source$.subscribe((event) => life.dispose(wrangle.reason(event)));
      if (life.disposed) subscription.unsubscribe();
      else upstream.add(subscription);
    }
  }
  if (life.disposed) return api;

  let observation: ScreenResizeObservation;
  try {
    observation = deps.observeResize(measure);
  } catch (error) {
    life.dispose(error);
    throw error;
  }

  if (observation.kind === 'unsupported') return api;
  listener.retain(observation.stop);
  if (life.disposed) return api;

  try {
    measure();
  } catch (error) {
    life.dispose(error);
    throw error;
  }
  return api;
}

export function events(until?: t.UntilInput): t.CliScreen.Events {
  return createEvents({
    measure: ScreenPlatform.measure,
    observeResize: ScreenPlatform.observeResize,
  }, until);
}

/**
 * Helpers:
 */
function createDeferredCleanup() {
  let cleanup: (() => void) | undefined;
  let released = false;

  return {
    retain(next: () => void) {
      if (released) next();
      else cleanup = next;
    },
    release() {
      if (released) return;
      released = true;
      const current = cleanup;
      cleanup = undefined;
      current?.();
    },
  } as const;
}

const wrangle = {
  sameSize(a: t.CliScreen.Size, b: t.CliScreen.Size) {
    return a.width === b.width && a.height === b.height;
  },
  termination(input?: t.UntilInput): Termination | undefined {
    if (Is.array<t.UntilInput>(input)) {
      for (const item of input) {
        const termination = wrangle.termination(item);
        if (termination) return termination;
      }
      return undefined;
    }
    if (Is.abortSignal(input) && input.aborted) return { reason: input.reason };
    if (Is.disposable(input) && 'disposed' in input && input.disposed === true) return {};
    return undefined;
  },
  reason(input: unknown) {
    return Is.record(input) ? input.reason : undefined;
  },
} as const;
