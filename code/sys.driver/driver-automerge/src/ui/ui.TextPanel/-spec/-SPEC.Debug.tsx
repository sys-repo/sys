import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { type t, Button, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';

export type SampleDoc = { text?: string };
type P = t.TextPanelProps;
type Storage = Pick<P, 'theme' | 'debug' | 'label' | 'path'> & { padding?: t.Pixels };

export const STORAGE_KEY = { DEV: `dev:${D.name}.docid` };

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

  const defaults: Storage = {
    theme: 'Dark',
    debug: true,
    padding: 0,
    label: 'Description',
    path: ['text'],
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [{ ws: 'sync.db.team' }],
  });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    padding: s(snap.padding),
    label: s(snap.label),

    doc: s<t.CrdtRef<SampleDoc>>(),
    path: s<P['path']>(snap.path),
  };
  const p = props;
  const api = {
    props,
    repo,
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
      d.padding = p.padding.value;
      d.label = p.label.value;
      d.path = p.path.value;
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
      <div className={Styles.title.class}>
        <div>{`${D.name}`}</div>
        <div>{'Persistent / CRDT'}</div>
      </div>

      <Button
        block
        label={() => {
          const v = p.path.value;
          return `path: ${v ? `[ ${v} ]` : `<undefined>`}`;
        }}
        onClick={() => {
          Signal.cycle(p.path, [
            undefined,
            ['text'],
            ['foo', 'bar'],
            ['project', 'canvas', 'purpose'],
          ]);
        }}
      />

      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `label: ${p.label.value ?? `<undefined> (default: ${D.label})`}`}
        onClick={() => Signal.cycle(p.label, [undefined, 'My Label', 'Description'])}
      />
      <Button
        block
        label={() => `padding: ${p.padding.value}`}
        onClick={() => Signal.cycle(p.padding, [0, 5, 15])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject({ ...p, doc: p.doc.value?.current })}
        expand={1}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
