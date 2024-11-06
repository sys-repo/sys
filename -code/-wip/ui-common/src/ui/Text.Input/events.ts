import { rx, type t } from './common.ts';

/**
 * Factory for an events API of the <TextInput>.
 */
export function eventsFactory(
  source$: t.Observable<t.TextInputEvent>,
  options: { dispose$?: t.UntilObservable } = {},
): t.TextInputEvents {
  const life = rx.lifecycle(options.dispose$);
  const { dispose, dispose$ } = life;
  const $ = source$.pipe(rx.takeUntil(dispose$));
  const key$ = rx.payload<t.TextInputKeyEvent>($, 'sys.TextInput:Key');
  const focus$ = rx.payload<t.TextInputFocusEvent>($, 'sys.TextInput:Focus');
  const selection$ = rx.payload<t.TextInputSelectionEvent>($, 'sys.TextInput:Selection');

  type A = t.TextInputKeyEventPayload['action'];
  const keyHandler = (action: A) => {
    const $ = key$.pipe(rx.filter((e) => e.action === action));
    return (fn: t.TextInputKeyHandler) => $.subscribe((e) => fn(e.event));
  };
  const focusHandler = (focused: boolean | null) => {
    type A = t.TextInputFocusArgs;
    const isMatch = (e: A) => (focused === null ? true : (e.is.focused = focused));
    const $ = focus$.pipe(rx.filter(isMatch));
    return (fn: t.TextInputFocusHandler) => $.subscribe(fn);
  };

  const api: t.TextInputEvents = {
    $,
    change$: rx.payload<t.TextInputChangeEvent>($, 'sys.TextInput:Change'),
    focus$,
    key$,
    tab$: rx.payload<t.TextInputTabEvent>($, 'sys.TextInput:Tab'),
    selection$,

    onChange: (fn) => api.change$.subscribe(fn),
    onKeyDown: keyHandler('KeyDown'),
    onKeyUp: keyHandler('KeyUp'),
    onEnter: keyHandler('Enter'),
    onEscape: keyHandler('Escape'),
    onTab: (fn) => api.tab$.subscribe(fn),
    onSelection: (fn) => api.selection$.subscribe(fn),

    onFocus: (fn) => focusHandler(true),
    onBlur: (fn) => focusHandler(false),
    onFocusChange: (fn) => focusHandler(null),

    dispose,
    dispose$,
    get disposed() {
      return api.disposed;
    },
  };
  return api;
}
