import React, { useRef } from 'react';
import { type t, Time } from './common.ts';

type Options = { timeout?: t.Msecs };
type Kind = t.DocumentIdInputAction;

/**
 * Hook: stateful management of transient message display (eg. "copied").
 */
export function useTransientMessage(options: Options = {}) {
  const { timeout = 1500 } = options;
  const timeoutRef = useRef<() => void>();

  const [message, setMessage] = React.useState<string>();
  const [kind, setKind] = React.useState<Kind>();

  const clear = () => {
    setMessage(undefined);
    setKind(undefined);
  };

  return {
    kind,
    message,
    write(kind: Kind, text: string, options: Options = {}) {
      const msecs = options.timeout ?? timeout;
      timeoutRef.current?.();
      setKind(kind);
      setMessage(text);
      timeoutRef.current = Time.delay(msecs, clear).cancel;
    },
    toObject(): t.DocumentIdHook['transient'] {
      return { kind, message, timeout };
    },
  };
}
