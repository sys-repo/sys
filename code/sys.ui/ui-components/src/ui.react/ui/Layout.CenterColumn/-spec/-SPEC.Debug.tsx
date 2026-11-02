import React from 'react';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, type t } from './common.ts';
import { renderColumns } from './-u.render.tsx';

type P = t.CenterColumnLayoutProps;

type Storage = Pick<P, 'debug' | 'theme' | 'centerWidth' | 'align' | 'gap'>;
const defaults: Storage = {
  theme: 'Light',
  debug: false,
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

  function updateColumns(props: Pick<P, 'theme' | 'align'>) {
    const el = renderColumns({
      ...props,
      onAlignChange: (e) => (p.align.value = e.align),
    });
    p.left.value = el.left;
    p.center.value = el.center;
    p.right.value = el.right;
  }
  function update() {
    const theme = p.theme.value;
    const align = p.align.value;
    updateColumns({ theme, align });
  }

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),

    centerWidth: s(snap.centerWidth),
    align: s(snap.align),
    gap: s(snap.gap),

    left: s<P['left']>(),
    center: s<P['center']>(),
    right: s<P['right']>(),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
    update,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    update();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.centerWidth = p.centerWidth.value;
      d.align = p.align.value;
      d.gap = p.gap.value;
    });
  });

  Signal.effect(update);
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
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  const align = (align: t.CenterColumnAlign) => {
    return (
      <Dev.Button
        //
        block
        label={`align: ${align}`}
        onClick={() => (p.align.value = align)}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Dev.Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Dev.Button
        block
        label={`gap: ${p.gap.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle(p.gap, [1, 15, undefined])}
      />

      <Dev.Button
        block
        label={`centerWidth: ${p.centerWidth.value ?? `(undefined) ← default: ${D.center.width}`}`}
        onClick={() => Signal.cycle(p.centerWidth, [0, 200, 600, undefined])}
      />

      <hr />
      {align('Left')}
      {align('Center')}
      {align('Right')}

      <hr />
      <Dev.Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Dev.Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <Dev.ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={0}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};
