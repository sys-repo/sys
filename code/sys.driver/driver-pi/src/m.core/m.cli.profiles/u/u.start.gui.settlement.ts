import { Is } from '../common.ts';

const apply = Reflect.apply;
const NativeWeakSet = WeakSet;
const failures = new NativeWeakSet<object>();
const weakSetAdd = NativeWeakSet.prototype.add;
const weakSetHas = NativeWeakSet.prototype.has;

/** Mark one final failure after trusted foreground release and owned cleanup have settled. */
export function markCliSettledFailure(error: Error): void {
  apply(weakSetAdd, failures, [error]);
}

/** Identify only a package-authenticated failure settled for the user-facing task boundary. */
export function isCliSettledFailure(input: unknown): input is Error {
  return Is.object(input) && apply(weakSetHas, failures, [input]) === true;
}

/** Convert only a fully presented and settled GUI failure into a deliberate CLI exit status. */
export async function settleCliRun(run: () => Promise<unknown>): Promise<0 | 1> {
  try {
    await run();
    return 0;
  } catch (cause) {
    if (isCliSettledFailure(cause)) return 1;
    throw cause;
  }
}
