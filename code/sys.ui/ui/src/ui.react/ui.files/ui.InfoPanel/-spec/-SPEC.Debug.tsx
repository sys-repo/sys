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

type Storage = Pick<t.Files.InfoPanel.Props, 'debug' | 'theme' | 'fields'> & {
  events?: t.Files.InfoPanel.State['events'];
};
const defaults = {
  debug: false,
  theme: 'Dark',
  snapshot: { status: 'stopped' },
  events: D.events,
  fields: [...D.fields],
} satisfies Storage & { snapshot: t.Files.InfoPanel.Snapshot };

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
    fields: [...defaults.fields],
  });
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    snapshot: s<t.Files.InfoPanel.Snapshot>(defaults.snapshot),
    events: { enabled: s(snap.events?.enabled ?? defaults.events.enabled) },
    fields: s([...(snap.fields ?? defaults.fields)]),
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
    p.fields.value;
  }

  function reset() {
    void disconnect(api);
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.snapshot.value = defaults.snapshot;
    p.events.enabled.value = defaults.events.enabled;
    p.fields.value = [...defaults.fields];
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.events = { enabled: p.events.enabled.value };
      d.fields = p.fields.value;
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
  const debugTheme = Color.theme();
  const styles = {
    base: css({ color: debugTheme.fg }),
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
      <Files.InfoPanel.Config.UI
        theme={debugTheme.name}
        fields={p.fields.value}
        events={v.events}
        onFieldsChange={({ next }) => {
          p.fields.value = next;
        }}
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
  stopped: defaults.snapshot,
  ready: { status: 'ready', capabilities: readyCapabilities },
  error: { status: 'error', error: Err.std(new Error('Sample Files error')) },
} as const satisfies Record<string, t.Files.InfoPanel.Snapshot>;

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
} as const;
