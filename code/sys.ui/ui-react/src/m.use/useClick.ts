import { useEffect, useRef } from 'react';
import type { t } from '../common.ts';

type E = HTMLElement;
type Div = HTMLDivElement;
type MouseEventName = 'mousedown' | 'mouseup';

const DEFAULT_STAGE: t.UseClickStage = 'down';

export const useClickOutside: t.UseClickHook = <T extends E = Div>(input: t.UseClickInput<T>) => {
  const { callback, stage, ref, event } = wrangle.args<T>(input);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as E)) callback?.(e);
    };
    document?.addEventListener(event, handler, true);
    return () => document?.removeEventListener(event, handler, true);
  }, [event, ref, callback]);

  const api: t.UseClick<T> = { ref, stage };
  return api;
};

export const useClickInside: t.UseClickHook = <T extends E = Div>(input: t.UseClickInput<T>) => {
  const { callback, stage, ref, event } = wrangle.args<T>(input);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as E)) callback?.(e);
    };
    document?.addEventListener(event, handler, true);
    return () => document?.removeEventListener(event, handler, true);
  }, [event, ref, callback]);

  return { ref, stage } as const;
};

/**
 * Helpers
 */
const wrangle = {
  args<T extends E>(input: t.UseClickInput<T>) {
    const { callback, stage = DEFAULT_STAGE, ref = useRef<T>(null) } = wrangle.input<T>(input);
    const event = wrangle.eventName(stage);
    return { callback, event, ref, stage };
  },

  input<T extends E>(input: t.UseClickInput<T>): t.UseClickProps<T> {
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
