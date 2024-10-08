/**
 * Common RXJS
 */
export {
  animationFrameScheduler,
  BehaviorSubject,
  firstValueFrom,
  interval,
  lastValueFrom,
  Observable,
  observeOn,
  of,
  scan,
  Subject,
  timer,
} from 'rxjs';

export {
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
} from 'rxjs';

/**
 * Alias: shorter name.
 */
import { distinctUntilChanged } from 'rxjs';
export const distinctWhile = distinctUntilChanged;

/**
 * 💦💦
 *
 *    NOTE: The take-until RXJS operator is exported here
 *    to avoid an error occuring when the module is bundled.
 *
 * 💦
 *
 * Error Condition:
 *
 *    const { dispose$ } from rx.disposable()
 *    takeUtil(dispose$)
 *
 * Will throw (as of Sep 2022):
 *
 *    ERROR: "TypeError: You provided an invalid object where a stream was expected."
 *
 * This is realted to the use of Symbols getting munged somehow during bundling within
 * the check RXJS makes of the observable that is passed into the [takeUtil] function.
 *
 */
export { merge, takeUntil } from 'rxjs';
