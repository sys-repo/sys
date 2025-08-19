import React from 'react';
import { createRepo } from '../../-test.ui.ts';
import { LanguagesList } from '../../ui.Editor.Monaco/-spec/-ui.ts';

import {
  type t,
  A,
  Button,
  Crdt,
  css,
  D,
  EditorFolding,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
} from '../common.ts';
import { YamlSyncDebug } from './-u.yaml.tsx';

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

  const defaults: Storage = {
    language: 'typescript',
    theme: 'Dark',
    debug: true,
    path: ['text'],
    debounce: true,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    path: s(snap.path),
    language: s(snap.language),
    debounce: s(snap.debounce),

    monaco: s<t.Monaco.Monaco>(),
    editor: s<t.Monaco.Editor>(),
    carets: s<t.EditorCarets>(),

    doc: s<t.Crdt.Ref>(),
    binding: s<t.EditorCrdtBinding>(),
    hiddenAreas: s<t.Monaco.I.IRange[]>(),
  };
  const p = props;
  const repo = createRepo();
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
  const p = debug.props;

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
      <div className={Styles.title.class}>{D.name}</div>

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
          editor={p.editor.value}
          debounce={p.debounce.value}
          style={{ marginTop: 20 }}
        />
      )}

      <hr />
      <div className={Styles.title.class}>{'Folding:'}</div>

      <Button
        block
        enabled={() => !!p.editor.value}
        label={() => `fold: 2, 7`}
        onClick={() => {
          const editor = p.editor.value;
          if (editor) EditorFolding.fold(editor, 2, 7);
        }}
      />

      <Button
        block
        enabled={() => !!p.editor.value}
        label={() => `unfold: 2, 7`}
        onClick={() => {
          const editor = p.editor.value;
          if (editor) EditorFolding.unfold(editor, 2, 7);
        }}
      />
      {(p.hiddenAreas.value ?? []).length > 0 && (
        <ObjectView
          name={'hidden'}
          data={p.hiddenAreas.value ?? []}
          style={{ marginTop: 6 }}
          expand={1}
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
        label={() => `splice: +🌳 `}
        onClick={() => {
          const lang = p.language.value;
          const text = lang === 'yaml' ? '# 🌳 ' : '// 🌳 ';
          doc.change((d) => A.splice(d, path, 0, 0, text));
        }}
      />

      <Button
        block
        label={() => `crdt: URI's `}
        onClick={() => {
          const text = `crdt:create`;
          doc.change((d) => A.splice(d, path, 0, 0, text));
        }}
      />

      <Button
        block
        label={() => `(clear)`}
        onClick={() => {
          const current = Obj.Path.get<string>(doc.current, path);
          const length = current?.length ?? 0;
          doc.change((d) => {
            A.splice(d, path, 0, length); // ← remove all existing characters.
            A.splice(d, path, 0, 0, ''); //  ← insert empty string (no-op, but makes intent explicit).
          });
        }}
      />
    </React.Fragment>
  );
}
