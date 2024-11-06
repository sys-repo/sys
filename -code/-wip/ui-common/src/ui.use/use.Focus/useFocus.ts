import { type RefObject, useEffect, useRef, useState } from 'react';
import { ActiveElement, Focus } from '../../ui/Focus/mod.ts';
import { R, type t } from '../common.ts';

/**
 * Monitors focus state for an element,
 * and causes redraws when focus changes.
 */
export function useFocus<H extends HTMLElement = HTMLDivElement>(
  input?: RefObject<H>,
  options: { redraw?: boolean; onFocus?: t.FocusHandler } = {},
): t.FocusHook<H> {
  const _ref = useRef<H>(null);
  const ref = input || _ref;

  const [, setCount] = useState(0);
  const redraw = () => setCount((prev: number) => prev + 1);

  /**
   * Lifecycle
   */
  useEffect(() => {
    const maybeRedraw = () => {
      if (options.redraw ?? true) redraw();
    };

    let _last: t.FocusHandlerArgs | undefined;
    const onFocus = (focus: boolean) => {
      const el = ref.current || undefined;
      const args = Focus.args(focus, el);
      if (options.onFocus && !R.equals(args, _last)) options.onFocus(args);
      _last = args;
    };

    const changeHandler = (focus: boolean) => {
      return () => {
        onFocus(focus);
        maybeRedraw();
      };
    };

    const elementMonitor = Focus.listen(ref, {
      onFocus: changeHandler(true),
      onBlur: changeHandler(false),
    });

    const activeElementMonitor = ActiveElement.listen((e) => {
      onFocus(e.focus);
      maybeRedraw();
    });

    return () => {
      activeElementMonitor.dispose();
      elementMonitor.dispose();
    };
  }, [ref, options.redraw]);

  /**
   * API
   */
  return {
    ref,
    get containsFocus() {
      return Focus.containsFocus(ref);
    },
    get withinFocus() {
      return Focus.withinFocus(ref);
    },
    get directlyFocused() {
      return Focus.containsFocus(ref) && Focus.withinFocus(ref);
    },
    invoke() {
      ref.current?.focus();
    },
  } as const;
}
