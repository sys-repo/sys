import { Is } from '../common.ts';
import type { BootState } from '../u.start/u.state.ts';

export type StartGuiControl = 'back' | 'quit';
export type StartGuiCompletionKind = StartGuiControl | 'external-cancellation';
export type StartGuiCompletion = { readonly kind: StartGuiCompletionKind };

/** Allow back only while the session can settle as clean navigation. */
export function allowsBack(state: BootState): boolean {
  return state.kind === 'preparing' || state.kind === 'starting-app-host' || state.kind === 'ready';
}

const apply = Reflect.apply;
const freeze = Object.freeze;
const NativeWeakSet = WeakSet;
const failures = new NativeWeakSet<object>();
const weakSetAdd = NativeWeakSet.prototype.add;
const weakSetHas = NativeWeakSet.prototype.has;
const BACK_COMPLETION: StartGuiCompletion = freeze({ kind: 'back' });
const QUIT_COMPLETION: StartGuiCompletion = freeze({ kind: 'quit' });
const EXTERNAL_COMPLETION: StartGuiCompletion = freeze({ kind: 'external-cancellation' });

/** Return one package-owned finite GUI completion. */
export function startGuiCompletion(kind: StartGuiCompletionKind): StartGuiCompletion {
  switch (kind) {
    case 'back':
      return BACK_COMPLETION;
    case 'quit':
      return QUIT_COMPLETION;
    case 'external-cancellation':
      return EXTERNAL_COMPLETION;
  }
}

/** Classify only a package-owned GUI completion without inspecting caller data. */
export function startGuiCompletionKind(input: unknown): StartGuiCompletionKind | undefined {
  if (input === BACK_COMPLETION) return 'back';
  if (input === QUIT_COMPLETION) return 'quit';
  if (input === EXTERNAL_COMPLETION) return 'external-cancellation';
  return;
}

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
