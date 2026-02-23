import React from 'react';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from './common.ts';

type Storage = {
  debug?: boolean;
  theme?: t.CommonTheme;
  textSubject?: string;
  textFooter?: string;
  overflow?: t.EditorPrompt.Overflow;
  maxLines?: number;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  textSubject: 'hello world 👋',
  textFooter: '',
  overflow: D.overflow,
  maxLines: 3,
};

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
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    textSubject: s(snap.textSubject),
    textFooter: s(snap.textFooter),
    overflow: s(snap.overflow),
    maxLines: s(snap.maxLines),
    stateSubject: s<t.EditorPrompt.State>(),
    stateFooter: s<t.EditorPrompt.State>(),
    editorSubject: s<t.Monaco.Editor>(),
    editorFooter: s<t.Monaco.Editor>(),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    p.editorSubject.value = undefined;
    p.editorFooter.value = undefined;
    p.stateSubject.value = undefined;
    p.stateFooter.value = undefined;
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.textSubject = p.textSubject.value;
      d.textFooter = p.textFooter.value;
      d.overflow = p.overflow.value;
      d.maxLines = p.maxLines.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
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
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => `overflow: ${p.overflow.value}`}
        onClick={() => {
          Signal.cycle<t.EditorPrompt.Overflow>(p.overflow, ['clamp', 'scroll']);
        }}
      />

      <hr />
      <Button
        block
        label={() => `single-line`}
        onClick={() => {
          p.maxLines.value = 1;
          p.overflow.value = 'clamp';
        }}
      />
      <Button
        block
        label={() => `max-lines: ${p.maxLines.value}`}
        onClick={() => Signal.cycle<number>(p.maxLines, [2, 3, 5, 10])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={'state'}
        data={{ subject: v.stateSubject, footer: v.stateFooter }}
        style={{ marginTop: 6 }}
        expand={1}
      />
    </div>
  );
};
