import type { KeyPressEvent } from '@cliffy/keypress';

/** Internal owner contract; test-injected owners may finish through their iterator alone. */
export type KeyboardInput = AsyncIterable<KeyPressEvent> & {
  /** Native owners report completed release here, not merely a stop request. */
  readonly disposed: boolean;
  /** Current release attempt; a failed attempt is replaced only when disposal is retried. */
  readonly finished?: Promise<void>;
  /** First failed release attempt, retained even after recovery completes. */
  readonly releaseFailure?: Error;
  /** Claim an input failure not already delivered through an iterator pull. */
  takeInputFailure?(): Readonly<{ cause: unknown }> | undefined;
  dispose(): void;
};

type InputListener = ((chunk: Uint8Array) => void) | ((cause: unknown) => void) | (() => void);

/** Borrowed native TTY surface, not ownership of the process stream or its descriptor. */
export type KeyboardInputStream = {
  readonly isRaw: boolean;
  setRawMode(raw: boolean): unknown;
  pause(): unknown;
  resume(): unknown;
  on(event: 'data' | 'error' | 'end', listener: InputListener): unknown;
  removeListener(event: 'data' | 'error' | 'end', listener: InputListener): unknown;
};

/** Internal acquisition and native read-stop scheduling seam. */
export type KeyboardInputDependencies = {
  stdin(): KeyboardInputStream;
  /** Invoke after queued native read-stop work, including any same-turn resume; not a microtask. */
  afterPause(callback: () => void): void;
};
