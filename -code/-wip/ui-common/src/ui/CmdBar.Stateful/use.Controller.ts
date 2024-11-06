import { useEffect, useState } from 'react';
import { Ctrl, DEFAULTS, ObjectPath, Path, rx, type t } from './common.ts';
import { Ref } from './Ref.ts';
import { useHistory } from './use.History.ts';

type P = t.CmdBarStatefulProps;

export function useController(props: P) {
  const { state, issuer } = props;
  const paths = wrangle.paths(props);
  const pathDeps = `${paths.text.join('.')}`;
  const resolve = Ctrl.Path.resolver(paths);

  const [ready, setReady] = useState(false);
  const [textbox, setTextbox] = useState<t.TextInputRef>();
  const [ctrl, setCtrl] = useState<t.CmdBarCtrl>();
  const [isFocused, setFocused] = useState(false);

  useHistory({
    enabled: props.useHistory ?? DEFAULTS.useHistory,
    state,
    ctrl,
    paths,
  });

  const [_, setRedraw] = useState(0);
  const redraw = () => setRedraw((n: number) => n + 1);

  /**
   * Enabled state.
   */
  let enabled = props.enabled ?? true;
  if (!state) enabled = false;
  if (!textbox) enabled = false;

  /**
   * Create the [cmdbar] command.
   */
  useEffect(() => {
    if (state) setCtrl(Ctrl.create({ transport: state, paths, issuer }));
  }, [state?.instance, issuer, pathDeps]);

  /**
   * Ready (→ Dispose)
   * NB:
   *     Textbox ←|→ State (Immutable<T>) syncer.
   *
   *     The instance specific syncer controller should
   *     activate within the onReady callback.
   */
  useEffect(() => {
    const life = rx.disposable();
    const { dispose, dispose$ } = life;
    if (ready && state && textbox && ctrl) {
      const text = api.text;
      const cmdbar = Ref.create({ ctrl, paths, textbox, dispose$ });
      props.onReady?.({ initial: { text }, cmdbar, textbox, paths, dispose$ });
    }
    return dispose;
  }, [ready, !!ctrl, pathDeps, state?.instance, !!textbox]);

  /**
   * Listen for changes in the state document.
   */
  useEffect(() => {
    const events = state?.events();
    events?.changed$.pipe(rx.observeOn(rx.animationFrameScheduler)).subscribe(redraw);
    return events?.dispose;
  }, []);

  /**
   * API: Event Handlers
   */
  const onReady: t.CmdBarReadyHandler = (e) => {
    if (ready) return;
    setTextbox(e.textbox);
    setCtrl(e.ctrl);
    setReady(true);
  };

  const onChange: t.CmdBarChangeHandler = (e) => {
    redraw();
    props.onChange?.(e);
  };

  const onSelect: t.TextInputSelectHandler = (e) => {
    props.onSelect?.(e);
  };

  const onFocusChange: t.TextInputFocusHandler = (e) => {
    setFocused(e.is.focused);
    props.onFocusChange?.(e);
  };

  /**
   * API
   */
  const api = {
    ready,
    enabled,
    ctrl,
    handlers: { onReady, onChange, onSelect, onFocusChange },

    get text() {
      return state ? resolve(state.current).text : '';
    },

    get hintKey(): string | string[] | undefined {
      if (!isFocused) return 'META + K';
      return;
    },

    get spinning(): boolean {
      return state ? !!resolve(state.current).meta.spinning : false;
    },

    get readOnly(): boolean {
      return state ? !!resolve(state.current).meta.readOnly : false;
    },
  } as const;
  return api;
}

/**
 * Helpers
 */
const wrangle = {
  paths(props: P) {
    const { paths = DEFAULTS.paths } = props;
    return ObjectPath.Is.path(paths) ? Path.prepend(paths) : paths;
  },
} as const;
