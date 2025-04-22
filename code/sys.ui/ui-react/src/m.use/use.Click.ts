import { useEffect, useRef } from 'react';
import { type t } from './common.ts';

type E = HTMLElement;
type Div = HTMLDivElement;
type MouseEventName = 'mousedown' | 'mouseup';
const DEFAULT_STAGE: t.UseClickStage = 'down';

/**
 * Hook: Monitors for click events outside the given element.
 * Usage:
 *    Useful for clicking away from modal dialogs or popups.
 */
export const useClickOutside: t.UseClickHook = <T extends E = Div>(input: t.UseClickInput<T>) => {
  return useHandler<T>(input, (el, e) => !el.contains(e.target as E));
};

/**
 * Hook: Monitors for click events within the given element.
 * Usage:
 *    Useful for clicking away from modal dialogs or popups.
 */
export const useClickInside: t.UseClickHook = <T extends E = Div>(input: t.UseClickInput<T>) => {
  return useHandler<T>(input, (el, e) => el.contains(e.target as E));
};

/**
 * Helpers
 */
function useHandler<T extends E = Div>(
  input: t.UseClickInput<T>,
  shouldInvoke: (el: E, e: MouseEvent) => boolean,
): t.ClickHook<T> {
  const { callback, stage, ref, event } = wrangle.args<T>(input);
  useEffect(() => {
    const handler: t.DomMouseEventHandler = (e) => {
      const el = ref.current;
      if (el && shouldInvoke(el, e)) callback?.(e);
    };
    document?.addEventListener(event, handler, true);
    return () => document?.removeEventListener(event, handler, true);
  }, [event, ref, callback]);
  return { ref, stage };
}

const wrangle = {
  args<T extends E>(input: t.UseClickInput<T>) {
    const { callback, stage = DEFAULT_STAGE, ref = useRef<T>(null) } = wrangle.input<T>(input);
    const event = wrangle.eventName(stage);
    return { callback, event, ref, stage };
  },

  input<T extends E>(input: t.UseClickInput<T>): t.ClickHookProps<T> {
    if (typeof input === 'object') return input;
    if (typeof input === 'function') return { callback: input };
    throw new Error('Unable to parse parameter input');
  },

  eventName(stage: t.UseClickStage): MouseEventName {
    if (stage === 'down') return 'mousedown';
    if (stage == 'up') return 'mouseup';
    throw new Error(`'${stage}' not supported`);
  },
} as const;
