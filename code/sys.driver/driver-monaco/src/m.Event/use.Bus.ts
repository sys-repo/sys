import { useRef } from 'react';
import { type t } from './common.ts';
import { Bus } from './m.Bus.ts';

/**
 * Always returns an editor event bus:
 * - If `input` is provided, use it.
 * - Otherwise, use a single stable fallback created once.
 */
export function useBus(input?: t.EditorBus.Subject) {
  const fallback = useRef<t.EditorBus.Subject>(Bus.make());
  return input ?? fallback.current;
}
