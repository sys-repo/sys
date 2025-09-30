/**
 * Curated RxJS surface for @sys/std
 *
 * This file is the single source of truth for what we bundle
 * into a pure ESM shim (`rx.esm.bundle.js`) during `deno task build:rx`.
 *
 * Consumers will import only through `@sys/std/rx`, never from "rxjs"
 * directly, so we stay in control of the runtime resolution.
 */

export {
  animationFrameScheduler,
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  defaultIfEmpty,
  EMPTY,
  firstValueFrom,
  interval,
  lastValueFrom,
  merge,
  Observable,
  observeOn,
  of,
  scan,
  shareReplay,
  startWith,
  Subject,
  takeUntil,
  timer,
} from 'rxjs';

export {
  auditTime,
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  map,
  mergeWith,
  take,
  tap,
  throttleTime,
  timeout,
} from 'rxjs/operators';

/** Alias: clearer semantics */
import { distinctUntilChanged } from 'rxjs/operators';
export const distinctWhile = distinctUntilChanged;
