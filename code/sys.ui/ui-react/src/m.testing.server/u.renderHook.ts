import type {
  RenderHookOptions,
  act as TLAct,
  renderHook as TLRenderHook,
} from '@testing-library/react';
import { DomMock } from './common.ts';

/**
 * NOTE: this file may import DomMock normally.
 * CRITICAL: This file must NOT import react-dom `@testing-library/*` at top-level.
 */

type Lazy = {
  readonly renderHook: typeof TLRenderHook;
  readonly act: typeof TLAct;
};

export async function renderHook<TResult, TProps>(
  callback: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>,
) {
  const m = await lazy();
  return m.renderHook(callback, options);
}

export async function act(fn: () => void | Promise<void>) {
  const m = await lazy();
  return m.act(fn);
}

/**
 * Helpers:
 */
let _lazy: Promise<Lazy> | undefined;

/**
 * Lazy-load React hook testing utilities AFTER DOM is present.
 *
 * Invariants:
 * - Safe to call even if tests already did beforeEach(DomMock.polyfill).
 * - Does not nest polyfill (respects DomMock.isPolyfilled).
 */
async function lazy(): Promise<Lazy> {
  ensureDom();

  _lazy ??= (async () => {
    const m = await import('@testing-library/react');
    return { renderHook: m.renderHook, act: m.act } as const;
  })();

  return _lazy;
}

/**
 * Ensures the DOM polyfill exists BEFORE we import any React DOM / test tooling.
 *
 * Why:
 * - Newer React/ReactDOM (and/or scheduler) may touch `window` at import-time.
 * - HappyDOM provides `window`, but only after `DomMock.polyfill()`.
 */
const ensureDom = () => {
  if (!DomMock.isPolyfilled) DomMock.polyfill();
};
