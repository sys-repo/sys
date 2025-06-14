import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { type t, Button, css, D, Is, LocalStorage, ObjectView, Signal } from '../common.ts';

type P = t.DocumentIdInputProps;
type Storage = { docId?: string; controlled?: boolean; passRepo?: boolean } & Pick<
  P,
  'theme' | 'label' | 'placeholder' | 'autoFocus' | 'enabled'
>;

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
  const localstore = LocalStorage.immutable<Storage>(`dev:${D.name}`, {});

  const repo = Crdt.repo({
    storage: 'IndexedDb',
    network: [{ wss: 'sync.db.team' }],
  });

  const props = {
    redraw: s(0),
    debug: s(false),
    theme: s(localstore.current.theme),
    controlled: s(localstore.current.controlled),
    passRepo: s(localstore.current.passRepo),

    docId: s(localstore.current.docId),
    docRef: s<t.CrdtRef>(),

    label: s<P['label']>(localstore.current.label),
    placeholder: s<P['placeholder']>(localstore.current.placeholder),
    autoFocus: s<P['autoFocus']>(localstore.current.autoFocus),
    enabled: s<P['enabled']>(localstore.current.enabled),
  };
  const p = props;
  const api = {
    props,
    repo,
    listen() {
      p.redraw.value;
      p.debug.value;
      p.theme.value;
      p.label.value;
      p.placeholder.value;
      p.controlled.value;
      p.passRepo.value;
      p.docId.value;
      p.docRef.value;
      p.autoFocus.value;
      p.enabled.value;
    },
  };

  Signal.effect(() => {
    localstore.change((d) => {
      d.theme = p.theme.value ?? 'Dark';
      d.label = p.label.value;
      d.placeholder = p.placeholder.value;
      d.autoFocus = p.autoFocus.value ?? D.autoFocus;
      d.controlled = p.controlled.value ?? true;
      d.passRepo = p.passRepo.value ?? true;
      d.docId = p.docId.value;
      d.enabled = p.enabled.value ?? D.enabled;
    });
  });

  // Listen to current document → redraw.
  let events: t.CrdtEvents | undefined;
  Signal.effect(() => {
    events?.dispose();
    events = p.docRef.value?.events();
    events?.changed$.subscribe((e) => p.redraw.value++);
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
    const doc = p.docRef.value;
    return Signal.toObject({ ...p, docRef: doc?.current });
  },
} as const;
