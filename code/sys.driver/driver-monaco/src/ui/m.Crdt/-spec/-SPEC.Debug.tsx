import React from 'react';
import { LanguagesList } from '../../ui.MonacoEditor/-spec/-ui.ts';

import { type t, Url, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { importLibs } from '../libs.ts';
import { YamlSyncDebug } from './-ui.Yaml.SyncDebug.tsx';

type P = t.MonacoEditorProps;
type Storage = Pick<P, 'language'> & {
  theme?: t.CommonTheme;
  debug?: boolean;
  path?: t.ObjectPath;
  debounce?: boolean;
};
export const STORAGE_KEY = { DEV: `dev:${D.name}.docid` };

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const { Crdt, A } = await importLibs();

  const defaults: Storage = {
    language: 'typescript',
    theme: 'Dark',
    debug: true,
    path: ['text'],
    debounce: true,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  /**
   * CRDT:
   */
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [
      // { ws: 'sync.db.team' },
      { ws: 'waiheke.sync.db.team' },
      isLocalhost && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    path: s(snap.path),
    language: s(snap.language),
    debounce: s(snap.debounce),

    editor: s<t.Monaco.Editor>(),
    carets: s<t.EditorCarets>(),

    doc: s<t.Crdt.Ref>(),
    binding: s<t.EditorCrdtBinding>(),
    selectedPath: s<t.ObjectPath>([]),
    hiddenAreas: s<t.Monaco.I.IRange[]>(),
  };
  const p = props;
  const api = {
    A,
    Crdt,
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
      d.language = p.language.value;
      d.debounce = p.debounce.value;
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
  const { Crdt, props: p } = debug;

  Signal.useRedrawEffect(() => debug.listen());
  Crdt.UI.useRedrawEffect(p.doc.value, {
    path: p.path.value,
    onRedraw: (e) => console.info(`⚡️ onRedraw:`, e),
  });

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

      <Button
        block
        label={() => `debounce: ${p.debounce.value}`}
        onClick={() => Signal.toggle(p.debounce)}
      />

      <hr />
      <div className={Styles.title.class}>{'Alter CRDT Document:'}</div>
      <AlterDocumentButtons debug={debug} />

      <hr />
      <div className={Styles.title.class}>{'Language:'}</div>
      <LanguagesList
        style={{ marginLeft: 15, marginBottom: 20 }}
        current={p.language.value}
        onSelect={(e) => (p.language.value = e.language)}
        show={['yaml', 'markdown', 'typescript']}
      />

      {p.language.value === 'yaml' && (
        <YamlSyncDebug
          doc={p.doc.value}
          path={p.path.value}
          debounce={p.debounce.value}
          style={{ marginTop: 20 }}
        />
      )}

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
        style={{ marginTop: 15 }}
      />
      <ObjectView
        name={'binding'}
        data={!p.binding.value ? {} : { ...p.binding.value, doc: p.binding.value.doc.current }}
        style={{ marginTop: 6 }}
      />
      {p.hiddenAreas.value && (
        <ObjectView
          name={'hidden'}
          data={p.hiddenAreas.value ?? []}
          style={{ marginTop: 6 }}
          expand={1}
        />
      )}
    </div>
  );
};

/**
 * DevHelpers:
 */
export function AlterDocumentButtons(props: { debug: DebugSignals }) {
  const { debug } = props;
  const { props: p, A } = debug;
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
        label={() => `splice: +🌳 `}
        onClick={() => {
          const lang = p.language.value;
          const text = lang === 'yaml' ? '# 🌳 ' : '// 🌳 ';
          doc.change((d) => A.splice(d, path, 0, 0, text));
        }}
      />
    </React.Fragment>
  );
}
