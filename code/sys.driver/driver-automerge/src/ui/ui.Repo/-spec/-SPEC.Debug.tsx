import React from 'react';
import { type t, Button, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type Storage = {
  debug?: boolean;
  theme?: t.CommonTheme;
  noRepo?: boolean;
  localstorageKey?: string;
};

const STORAGE_KEY = `dev:${D.name}.input`;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const defaults: Storage = {
    theme: 'Dark',
    debug: false,
    noRepo: false,
    localstorageKey: STORAGE_KEY,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    localstorageKey: s(snap.localstorageKey),
    noRepo: s(snap.noRepo),
    repo: s<t.CrdtRepo>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.noRepo = p.noRepo.value;
      d.localstorageKey = p.localstorageKey.value;
    });
  });

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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `no-repo: ${p.noRepo.value}`}
        onClick={() => Signal.toggle(p.noRepo)}
      />

      <Button
        block
        label={() => {
          const v = p.localstorageKey.value;
          return `localstorageKey: ${v ? `"${v}"` : '(none)'}`;
        }}
        onClick={() => {
          const s = p.localstorageKey;
          s.value = s.value ? undefined : STORAGE_KEY;
        }}
      />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 15 }} />
      <ObjectView name={'repo'} data={p.repo.value} expand={2} style={{ marginTop: 5 }} />
    </div>
  );
};
