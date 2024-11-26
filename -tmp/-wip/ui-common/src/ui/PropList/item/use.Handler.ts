import { useRef, useState } from 'react';
import { format } from '../u.format.ts';
import { DEFAULTS, ReactEvent, Time, type t } from './common.ts';

export function useHandler(
  input: t.PropListItem,
  handler?: t.PropListItemHandler | false,
  theme?: t.CommonTheme,
) {
  const item = format(input);
  const cursor = handler ? 'pointer' : undefined;

  const [message, setMessage] = useState<JSX.Element | string>();
  const timer = useRef<t.TimeDelayPromise>();

  /**
   * Handlers
   */
  const showMessage = (message: JSX.Element | string, hideAfter?: t.Msecs) => {
    timer.current?.cancel();
    setMessage(message);
    const msecs = hideAfter ?? DEFAULTS.messageDelay;
    timer.current = Time.delay(msecs, () => setMessage(undefined));
  };

  const onClick: React.MouseEventHandler = (e) => {
    if (!handler) return;

    const { value } = item;
    let _message: JSX.Element | string | undefined;
    let _delay: number | undefined;

    handler({
      theme: theme ?? DEFAULTS.theme,
      item: input,
      value,
      modifiers: ReactEvent.modifiers(e),
      message(text, msecs) {
        _message = text;
        _delay = msecs;
      },
    });

    if (_message) showMessage(_message, _delay);
  };

  /**
   * API
   */
  return {
    message,
    cursor,
    onClick: handler ? onClick : undefined,
  } as const;
}
