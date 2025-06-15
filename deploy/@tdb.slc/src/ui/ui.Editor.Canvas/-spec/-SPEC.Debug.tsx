import React from 'react';
import { type t, Button, Crdt, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';

type P = t.EditorCanvasProps;
type Storage = Pick<P, 'theme'>;

type Doc = { text: string };

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

  const repo = Crdt.repo({ storage: true, network: [{ ws: 'sync.db.team' }] });

  const props = {
    debug: s(false),
    theme: s(localstore.current.theme),
    doc: s<t.CrdtRef<Doc>>(),
  };
  const p = props;
  const api = {
    props,
    repo,
    listen() {
      p.debug.value;
      p.theme.value;
      p.doc.value;
    },
  };

  Signal.effect(() => {
    localstore.change((d) => {
      d.theme = p.theme.value ?? 'Dark';
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

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject({ ...p, doc: p.doc.value?.current })}
        expand={['$', '$.doc']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
