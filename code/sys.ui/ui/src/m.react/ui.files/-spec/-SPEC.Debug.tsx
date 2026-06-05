import React from 'react';
import { Button, Color, css, D, Err, LocalStorage, ObjectView, Signal, type t } from './common.ts';
import { connect, disconnect } from './-u.connect.ts';

type P = t.FileInfoPanel.Props;
type Defaults = Required<Pick<P, 'debug' | 'theme' | 'snapshot'>>;
type Storage = Pick<Defaults, 'debug' | 'theme'>;

const readyCapabilities: t.Files.Capabilities = {
  list: true,
  stat: true,
  read: true,
  write: false,
  remove: false,
  watch: true,
  manifest: true,
};

const snapshots = {
  stopped: { status: 'stopped' },
  ready: { status: 'ready', capabilities: readyCapabilities },
  error: { status: 'error', error: Err.std(new Error('Sample Files error')) },
} as const satisfies Record<string, t.FileInfoPanel.Snapshot>;

const defaults: Defaults = {
  debug: false,
  theme: 'Dark',
  snapshot: snapshots.stopped,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, {
    debug: defaults.debug,
    theme: defaults.theme,
  });
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    snapshot: s(defaults.snapshot),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    void disconnect(api);
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.snapshot.value = defaults.snapshot;
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
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
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button block label={() => `connect`} onClick={() => void connect(debug)} />
      <Button block label={() => `disconnect`} onClick={() => void disconnect(debug)} />

      <hr />
      <Button
        block
        label={() => `snapshot: stopped`}
        onClick={() => p.snapshot.value = snapshots.stopped}
      />
      <Button
        block
        label={() => `snapshot: ready`}
        onClick={() => p.snapshot.value = snapshots.ready}
      />
      <Button
        block
        label={() => `snapshot: error`}
        onClick={() => p.snapshot.value = snapshots.error}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
