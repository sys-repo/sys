import { Is, Ctrl, rx, type t } from './common.ts';

export const Ref = {
  /**
   * Ref factory.
   */
  create(args: {
    ctrl: t.CmdBarCtrl;
    paths: t.CmdBarPaths;
    textbox: t.TextInputRef;
    dispose$: t.Observable<any>;
  }): t.CmdBarRef {
    const { paths, ctrl, textbox, dispose$ } = args;
    const resolve = Ctrl.Path.resolver(paths);
    let _textboxEvents: t.TextInputEvents | undefined;

    const cmdbar: t.CmdBarRef = {
      ctrl,
      paths,
      resolve,
      dispose$,
      get current() {
        const { value: text, focused, selection } = textbox.current;
        return { text, focused, selection };
      },
      onChange(fn, options) {
        const op = wrangle.changeOptions(options);
        const life = rx.lifecycle(op.dispose$);
        const events = _textboxEvents || (_textboxEvents = textbox.events(life.dispose$));
        let $ = events.$.pipe(rx.takeUntil(life.dispose$));
        if (typeof op.debounce === 'number') $ = $.pipe(rx.debounceTime(op.debounce));
        $.pipe(rx.observeOn(rx.animationFrameScheduler)).subscribe(() => fn(cmdbar.current));
        return life;
      },
    };

    return cmdbar;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  changeOptions(
    input?: t.CmdBarRefOnChangeOptions | t.UntilObservable,
  ): t.CmdBarRefOnChangeOptions {
    if (!input) return {};
    if (Is.observable(input)) return { dispose$: input };
    return input as t.CmdBarRefOnChangeOptions;
  },
} as const;
