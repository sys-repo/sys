import React from 'react';
import { createRepo } from '../../-test.ui.ts';
import { type t, Button, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';

type P = t.DevEditorProps;
type E = t.DevEditorEditorProps;

type Storage = Pick<P, 'theme' | 'debug'> & {
  editorMargin?: E['margin'];
  editorMinimap?: E['minimap'];
};
const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  editorMargin: 50,
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
    editor: {
      margin: s(snap.editorMargin),
      minimap: s(snap.editorMinimap),
    },
  };
  const p = props;
  const repo = createRepo();
  const api = {
    props,
    repo,
    listen() {
      Signal.listen(props);
      Signal.listen(props.editor);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.editorMargin = p.editor.margin.value;
      d.editorMinimap = p.editor.minimap.value;
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
      <div className={Styles.title.class}>{`${D.name}.Editor`}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
