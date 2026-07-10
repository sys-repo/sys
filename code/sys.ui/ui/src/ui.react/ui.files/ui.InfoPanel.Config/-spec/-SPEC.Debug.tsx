import React from 'react';
import {
  Button,
  Color,
  css,
  D,
  LocalStorage,
  ObjectView,
  Signal,
  STORAGE_KEY,
  type t,
} from './common.ts';

type Storage = {
  debug: boolean;
  theme: t.CommonTheme;
  reorder: boolean;
  fields: t.Files.InfoPanel.Field[];
  cursorEnabled: boolean;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  reorder: true,
  fields: [...D.fields],
  cursorEnabled: false,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Create persisted debug signals for the InfoPanel.Config spec.
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    reorder: s(snap.reorder),
    fields: s(snap.fields),
    cursor: {
      enabled: s(snap.cursorEnabled ?? defaults.cursorEnabled),
      model: s<t.KeyValue.Cursor.Model>({}),
    },
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
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.reorder.value = defaults.reorder;
    p.fields.value = [...defaults.fields];
    p.cursor.enabled.value = defaults.cursorEnabled;
    p.cursor.model.value = {};
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.reorder = p.reorder.value;
      d.fields = p.fields.value;
      d.cursorEnabled = p.cursor.enabled.value;
    });
  });

  return api;
}

/**
 * Render debug controls for the InfoPanel.Config spec.
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
  } as const;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `reorder: ${v.reorder}`}
        onClick={() => Signal.toggle(p.reorder)}
      />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `cursor.enabled: ${v.cursor.enabled}`}
        onClick={() => Signal.toggle(p.cursor.enabled)}
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
const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
} as const;
