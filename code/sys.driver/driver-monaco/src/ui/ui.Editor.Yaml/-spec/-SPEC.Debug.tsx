import React from 'react';
import { createRepo } from '../../-test.ui.ts';
import {
  type t,
  Button,
  Crdt,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  STORAGE_KEY,
} from '../common.ts';

type P = t.YamlEditorProps;
type Storage = Pick<P, 'theme' | 'debug' | 'path'> & {
  editor: Pick<t.YamlEditorMonacoProps, 'margin' | 'minimap'>;
  documentId: Pick<t.YamlEditorDocumentIdProps, 'visible' | 'readOnly' | 'urlKey'>;
  footer: P['footer'];
};

const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  path: ['foo'],
  documentId: {
    visible: true,
    readOnly: false,
    urlKey: undefined,
  },
  editor: {
    margin: 0,
    minimap: false,
  },
  footer: { visible: true, repo: true },
};

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
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    path: s(snap.path),

    documentId: {
      visible: s((snap.documentId ?? {}).visible),
      readOnly: s((snap.documentId ?? {}).readOnly),
      urlKey: s((snap.documentId ?? {}).urlKey),
      localstorage: STORAGE_KEY.DEV,
    },
    editor: {
      margin: s((snap.editor ?? {}).margin),
      minimap: s((snap.editor ?? {}).minimap),
    },
    footer: {
      visible: s((snap.footer ?? {}).visible),
      repo: s((snap.footer ?? {}).repo),
    },

    doc: s<t.Crdt.Ref>(),
  };

  const p = props;
  const api = {
    props,
    repo: createRepo(),
    listen() {
      Signal.listen(props);
      Signal.listen(props.documentId);
      Signal.listen(props.editor);
      Signal.listen(props.footer);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.path = p.path.value;

      d.editor = d.editor ?? {};
      d.editor.margin = p.editor.margin.value;
      d.editor.minimap = p.editor.minimap.value;

      d.documentId = d.documentId ?? {};
      d.documentId.visible = p.documentId.visible.value;
      d.documentId.readOnly = p.documentId.readOnly.value;
      d.documentId.urlKey = p.documentId.urlKey.value;

      d.footer = d.footer ?? {};
      d.footer.visible = p.footer.visible.value;
      d.footer.repo = p.footer.repo.value;
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
      <div className={Styles.title.class}>
        <div>{`${D.name}.Editor`}</div>
        <div>{'YAML'}</div>
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
        onClick={() => Signal.cycle(p.path, [['foo'], ['sample', 'deep'], undefined])}
      />

      <hr />
      <Button
        block
        label={() => `editor.margin: ${p.editor.margin.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.editor.margin, [0, 50, [100, 80], undefined])}
      />
      <Button
        block
        label={() => `editor.minimap: ${p.editor.minimap.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.editor.minimap)}
      />

      <hr />
      <Button
        block
        label={() => `documentId.visible: ${p.documentId.visible.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.documentId.visible)}
      />
      <Button
        block
        label={() => `documentId.readOnly: ${p.documentId.readOnly.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.documentId.readOnly)}
      />
      <Button
        block
        label={() => `documentId.urlKey: ${p.documentId.urlKey.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.documentId.urlKey, ['foo', undefined])}
      />

      <hr />
      <Button
        block
        label={() => `footer.visible: ${p.footer.visible.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.footer.visible)}
      />
      <Button
        block
        label={() => `footer.repo: ${p.footer.repo.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.footer.repo)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)))}
      />

      <ObjectView name={'debug'} data={safeProps(debug)} expand={0} style={{ marginTop: 15 }} />
    </div>
  );
};

/**
 * Helpers:
 */
function safeProps(debug: DebugSignals) {
  const p = { ...debug.props } as any;
  delete p.doc;
  return Signal.toObject(p);
}
