import React from 'react';

import { Crdt } from '@sys/driver-automerge/ui';
import { type t, A, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

type Storage = { theme?: t.CommonTheme; debug?: boolean; path?: t.ObjectPath };
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
    path: s(snap.path),

    editor: s<t.Monaco.Editor>(),
    doc: s<t.CrdtRef>(),
    binding: s<t.EditorCrdtBinding>(),
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

  Crdt.UI.useRedrawEffect(p.doc.value);
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
        <div>{D.name}</div>
        <div>{'Data Binding'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => {
          const v = p.path.value;
          return `path: ${v ? `[ ${v} ]` : `<undefined>`}`;
        }}
        onClick={() => {
          Signal.cycle(p.path, [undefined, ['text'], ['foo', 'bar']]);
        }}
      />

      <hr />
      <div className={Styles.title.class}>{'Alter Document (CRDT):'}</div>
      <AlterDocumentButtons debug={debug} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={{
          ...Signal.toObject(p),
          doc: p.doc.value?.current,
        }}
        // expand={['$', '$.doc']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * DevHelpers:
 */
export function AlterDocumentButtons(props: { debug: DebugSignals }) {
  const { debug } = props;
  const p = debug.props;
  const doc = p.doc.value;
  const path = p.path.value;

  if (!doc || !path) return null;
  const Mutate = Obj.Path.Mutate;

  return (
    <React.Fragment>
      <Button
        block
        label={() => `replace: "Hello 👋"`}
        onClick={() => {
          const next = `// Hello 👋\n`;
          doc.change((d) => Mutate.set(d, path, next));
        }}
      />

      <Button
        block
        label={() => `splice: 🌳 `}
        onClick={() => {
          doc.change((d) => A.splice(d, path, 0, 0, '// 🌳'));
        }}
      />
    </React.Fragment>
  );
}
