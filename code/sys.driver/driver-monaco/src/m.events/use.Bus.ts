import { useRef } from 'react';
import { type t } from './common.ts';
import { Bus } from './m.Bus.ts';

/**
 * Always returns an EditorEventBus:
 * - If `input` is provided, use it.
 * - Otherwise, use a single stable fallback created once.
 */
export function useBus(input?: t.EditorEventBus) {
  const fallback = useRef<t.EditorEventBus>(Bus.make());
  return input ?? fallback.current;
}
