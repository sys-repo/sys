import React from 'react';
import { SignalsObjectView } from '../-dev/ui.SignalsObjectView.tsx';
import { DevUrl } from '../../-test.ui.ts';
import {
  type t,
  Arr,
  Button,
  Color,
  Crdt,
  css,
  D,
  Icons,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
} from '../common.ts';

type P = t.VideoRecorderViewProps;
type Storage = Pick<P, 'theme' | 'debug' | 'aspectRatio'>;
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  aspectRatio: D.aspectRatio,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const signals: t.VideoRecorderViewSignals = {
    doc: s(),
    camera: s(),
    audio: s(),
    stream: s(),
    recorder: s(),
    config: s(),
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    aspectRatio: s(snap.aspectRatio),
  };
  const p = props;
  const api = {
    props,
    signals,
    // repo,
    // crdt,
    location: DevUrl.forWindow(window),
    reset,
    listen,
  };

  function listen() {
    Signal.listen(p, true);
    Signal.listen(signals);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.aspectRatio = p.aspectRatio.value;
    });
  });

  if (api.location.current.showDebug === false) p.debug.value = false;
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const signals = debug.signals;
  const doc = signals.doc?.value;

  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => (
          <div className={styles.vcenter.class}>
            <Icons.ClosePanel.Right />
            {`debug=false (via query-string → reload)`}
          </div>
        )}
        onClick={() => {
          debug.location.change((url) => (url.showDebug = false));
          window.location.reload();
        }}
      />
      <hr />

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `aspectRatio: ${p.aspectRatio.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle(p.aspectRatio, [D.aspectRatio, '16/9', 1.618])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <hr />
      <SignalsObjectView signals={signals} doc={doc} style={{ marginTop: 10 }} />
    </div>
  );
};
