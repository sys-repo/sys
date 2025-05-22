import { type t } from './common.ts';

/**
 * Detects whether the code is running inside a Farcaster Mini App.
 * If so, dynamically loads the Frame SDK and calls `ready()`.
 */
export type MiniAppHook = {
  /** `true` if the app is running inside a Farcaster Mini App. */
  isMiniApp: boolean;
  /** `@farcaster/frame-sdk` instance, available only when `isMiniApp` is `true`. */
  sdk?: typeof import('@farcaster/frame-sdk').sdk;
};
