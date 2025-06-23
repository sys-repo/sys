import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { type t, Button, css, D, Is, LocalStorage, ObjectView, Signal } from '../common.ts';

type P = t.DocumentIdProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type Storage = {
  controlled?: boolean;
  passRepo?: boolean;
  localstorage?: string;
} & Pick<P, 'theme' | 'label' | 'placeholder' | 'autoFocus' | 'enabled' | 'readOnly'>;

const STORAGE_KEY = `dev:${D.name}.input`;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const defaults: Storage = {
    theme: 'Dark',
    autoFocus: D.autoFocus,
    enabled: D.enabled,
    readOnly: D.readOnly,
    passRepo: true,
    controlled: true,
    localstorage: STORAGE_KEY,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [{ ws: 'sync.db.team' }],
  });

  const props = {
    redraw: s(0),
    debug: s(false),
    theme: s(snap.theme),
    passRepo: s(snap.passRepo),
    controlled: s(snap.controlled),
    localstorage: s(snap.localstorage),

    docId: s<string | undefined>(),
    doc: s<t.CrdtRef>(),

    label: s<P['label']>(store.current.label),
    placeholder: s(store.current.placeholder),
    autoFocus: s(store.current.autoFocus),
    enabled: s(store.current.enabled),
    readOnly: s(store.current.readOnly),
  };
  const p = props;
  const api = {
    props,
    repo,
    listen() {
      Object.values(p)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.label = p.label.value;
      d.placeholder = p.placeholder.value;
      d.autoFocus = p.autoFocus.value;
      d.passRepo = p.passRepo.value;
      d.enabled = p.enabled.value;
      d.readOnly = p.readOnly.value;
      d.controlled = p.controlled.value;
      d.localstorage = p.localstorage.value;
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
      <Button
        block
        label={() => `label: ${p.label.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.label, [undefined, 'My Descriptive Label:'])}
      />
      <Button
        block
        label={() => {
          const v = p.placeholder.value;
          return `placeholder: ${Is.string(v) ? v || '""' : `<undefined>`}`;
        }}
        onClick={() => Signal.cycle(p.placeholder, [undefined, 'My Placeholder', ''])}
      />
      <Button
        block
        label={() => `autoFocus: ${p.autoFocus.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.autoFocus)}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `readOnly: ${p.readOnly.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.readOnly)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />

      <Button
        block
        label={() => {
          const v = Boolean(p.controlled.value);
          return `controlled: ${v} 🌳 toggle → ${!v} (reload)`;
        }}
        onClick={() => {
          Signal.toggle(p.controlled);
          location.reload();
        }}
      />

      <Button
        block
        label={() => `pass repo: ${p.passRepo.value}`}
        onClick={() => Signal.toggle(p.passRepo)}
      />
      <Button
        block
        label={() => {
          const v = p.localstorage.value;
          return `localstorage: ${v ? `"${v}"` : '(none)'}`;
        }}
        onClick={() => {
          const s = p.localstorage;
          s.value = s.value ? undefined : STORAGE_KEY;
        }}
      />

      <hr />
      <ObjectView
        name={'debug'}
        data={wrangle.data(debug)}
        expand={['$', '$.docRef']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  data(debug: DebugSignals) {
    const p = debug.props;
    const doc = p.doc.value;
    return Signal.toObject({ ...p, doc: doc?.current });
  },
} as const;
