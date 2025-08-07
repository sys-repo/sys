import React from 'react';
import { createRepo } from '../../-test.ui.ts';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

type P = t.DevEditorProps;
type E = t.DevEditorMonacoProps;
type I = t.DevEditorDocumentIdProps;

type Storage = Pick<P, 'theme' | 'debug' | 'path'> & {
  editorMargin?: E['margin'];
  editorMinimap?: E['minimap'];
  docidVisible?: I['visible'];
  docidReadOnly?: I['readOnly'];
};
const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  path: ['foo'],
  docidVisible: true,
  docidReadOnly: false,
  editorMargin: 0,
  editorMinimap: false,
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

    docid: {
      visible: s(snap.docidVisible),
      readOnly: s(snap.docidReadOnly),
    },
    editor: {
      margin: s(snap.editorMargin),
      minimap: s(snap.editorMinimap),
    },

    doc: s<t.Crdt.Ref>(),
  };

  const p = props;
  const repo = createRepo();
  const api = {
    props,
    repo,
    listen() {
      Signal.listen(props);
      Signal.listen(props.docid);
      Signal.listen(props.editor);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.path = p.path.value;
      d.editorMargin = p.editor.margin.value;
      d.editorMinimap = p.editor.minimap.value;
      d.docidVisible = p.docid.visible.value;
      d.docidReadOnly = p.docid.readOnly.value;
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
        label={() => `path: ${p.path.value ? p.path.value.join(' / ') : `<undefined>`}`}
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
        label={() => `id.visible: ${p.docid.visible.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.docid.visible)}
      />
      <Button
        block
        label={() => `id.readOnly: ${p.docid.readOnly.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.docid.readOnly)}
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
        onClick={() => {
          p.docid.visible.value = defaults.docidVisible;
          p.docid.readOnly.value = defaults.docidReadOnly;
          p.editor.margin.value = defaults.editorMargin;
          p.editor.minimap.value = defaults.editorMinimap;
        }}
      />

      <ObjectView
        name={'debug'}
        data={{ ...Signal.toObject(p) }}
        expand={0}
        style={{ marginTop: 15 }}
      />
      <ObjectView
        name={'doc'}
        data={Obj.trimStringsDeep(Signal.toObject(p.doc.value?.current) ?? {})}
        expand={0}
        style={{ marginTop: 5 }}
      />
    </div>
  );
};
