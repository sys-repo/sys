import type * as rxjs from 'rxjs';
import type { t } from '../common.ts';

/**
 * Tools for working with Observables (via `rxjs`).
 */
export type RxLib = RxjsLib & {
  readonly Is: RxIs;
  readonly noop$: rxjs.Subject<any>;

  // Lifecycle:
  abortable: t.DisposeLib['abortable'];
  disposable: t.DisposeLib['disposable'];
  disposableAsync: t.DisposeLib['disposableAsync'];
  lifecycle: t.DisposeLib['lifecycle'];
  lifecycleAsync: t.DisposeLib['lifecycleAsync'];
  toLifecycle: t.DisposeLib['toLifecycle'];
  done: t.DisposeLib['done'];

  // Helpers:
  subject<T = void>(): rxjs.Subject<T>;
  withinTimeThreshold<T>(
    $: t.Observable<T>,
    timeout: t.Msecs,
    options?: { dispose$?: t.UntilObservable },
  ): t.TimeThreshold<T>;
};

/**
 * Type guards (boolean evaluators).
 */
export type RxIs = {
  event(input: any, type?: string | { startsWith: string }): boolean;
  observable: t.StdIsLib['observable'];
  subject: t.StdIsLib['subject'];
};

/**
 * Default methods exported from the [rxjs] library.
 */
type RxjsLib = {
  readonly distinctWhile: typeof rxjs.distinctUntilChanged;
  readonly animationFrameScheduler: typeof rxjs.animationFrameScheduler;
  readonly BehaviorSubject: typeof rxjs.BehaviorSubject;
  readonly firstValueFrom: typeof rxjs.firstValueFrom;
  readonly startWith: typeof rxjs.startWith;
  readonly shareReplay: typeof rxjs.shareReplay;
  readonly auditTime: typeof rxjs.auditTime;
  readonly interval: typeof rxjs.interval;
  readonly lastValueFrom: typeof rxjs.lastValueFrom;
  readonly Observable: typeof rxjs.Observable;
  readonly observeOn: typeof rxjs.observeOn;
  readonly of: typeof rxjs.of;
  readonly scan: typeof rxjs.scan;
  readonly skip: typeof rxjs.skip;
  readonly Subject: typeof rxjs.Subject;
  readonly timer: typeof rxjs.timer;
  readonly merge: typeof rxjs.merge;
  readonly takeUntil: typeof rxjs.takeUntil;
  readonly catchError: typeof rxjs.catchError;
  readonly debounceTime: typeof rxjs.debounceTime;
  readonly delay: typeof rxjs.delay;
  readonly filter: typeof rxjs.filter;
  readonly map: typeof rxjs.map;
  readonly mergeWith: typeof rxjs.mergeWith;
  readonly take: typeof rxjs.take;
  readonly tap: typeof rxjs.tap;
  readonly throttleTime: typeof rxjs.throttleTime;
  readonly timeout: typeof rxjs.timeout;
  readonly distinctUntilChanged: typeof rxjs.distinctUntilChanged;
  readonly defaultIfEmpty: typeof rxjs.defaultIfEmpty;
  readonly combineLatest: typeof rxjs.combineLatest;
  readonly combineLatestWith: typeof rxjs.combineLatestWith;
  readonly EMPTY: typeof rxjs.EMPTY;
};

/**
 * Represents a time threhold (for use with repeat operations, like double-click).
 */
export type TimeThreshold<T> = t.Lifecycle & {
  readonly $: t.Observable<T>;
  readonly timeout$: t.Observable<void>;
};
