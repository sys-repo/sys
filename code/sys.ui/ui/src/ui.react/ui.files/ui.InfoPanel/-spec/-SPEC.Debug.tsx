import React from 'react';
import {
  Button,
  Color,
  css,
  D,
  Err,
  LocalStorage,
  ObjectView,
  Signal,
  type t,
} from './common.ts';
import { Files } from '../../mod.ts';
import { connect, disconnect } from './-u.connect.ts';

type Defaults = Required<Pick<t.Files.InfoPanel.State, 'debug' | 'theme' | 'snapshot'>> & {
  events: Required<t.Files.InfoPanel.State['events']>;
};
type Storage = {
  debug?: t.Files.InfoPanel.State['debug'];
  theme?: t.Files.InfoPanel.State['theme'];
  events: t.Files.InfoPanel.State['events'];
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Create persisted debug signals for the InfoPanel spec.
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, {
    debug: defaults.debug,
    theme: defaults.theme,
    events: defaults.events,
  });
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    snapshot: s(defaults.snapshot),
    events: { enabled: s(snap.events?.enabled ?? defaults.events.enabled) },
  };
  const controller = Files.InfoPanel.controller({
    debug: props.debug,
    theme: props.theme,
    snapshot: props.snapshot,
    events: props.events,
  });
  const p = props;
  const api = {
    props,
    controller,
    listen,
    reset,
  };

  function listen() {
    controller.listen();
  }

  function reset() {
    void disconnect(api);
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.snapshot.value = defaults.snapshot;
    p.events.enabled.value = defaults.events.enabled;
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.events = { enabled: p.events.enabled.value };
    });
  });

  return api;
}

/**
 * Render debug controls for the InfoPanel spec.
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = debug.controller.view();
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  } as const;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div className={Styles.title.class}>{'Server'}</div>
      <Button block label={() => `connect`} onClick={() => void connect(debug)} />
      <Button block label={() => `disconnect`} onClick={() => void disconnect(debug)} />

      <hr />
      <div className={Styles.title.class}>{'override: props.snapshot'}</div>

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

/**
 * Helpers:
 */
const readyCapabilities: t.ModelFiles.Capabilities = {
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
} as const satisfies Record<string, t.Files.InfoPanel.Snapshot>;

const defaults: Defaults = {
  debug: false,
  theme: 'Dark',
  snapshot: snapshots.stopped,
  events: D.events,
};

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
} as const;
