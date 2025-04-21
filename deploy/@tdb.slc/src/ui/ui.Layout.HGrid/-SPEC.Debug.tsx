import React from 'react';
import { type t, Button, Color, css, ObjectView, Signal } from './common.ts';

type P = t.LayoutHGridProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;

  const styles = {
    center: css({ padding: 10 }),
    edge: css({
      padding: 10,
      backgroundColor: Color.alpha(Color.DARK, 0.04),
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const alignHandler = (align: t.HGridAlign) => {
    return () => {
      const value = p.center.value ?? {};
      p.center.value = { ...value, align };
    };
  };

  const edgeDiv = (edge: t.HGridAlign) => {
    return (
      <div className={styles.edge.class} onMouseDown={alignHandler(edge)}>
        {edge}
      </div>
    );
  };

  const left = edgeDiv('Left');
  const right = edgeDiv('Right');
  const children = (
    <div className={styles.center.class} onMouseDown={alignHandler('Center')}>
      {'👋 Hello Center (Column)'}
    </div>
  );

  const props = {
    debug: s<P['debug']>(true),
    theme: s<P['theme']>('Light'),
    left: s<P['left']>(left),
    center: s<P['center']>({ children }),
    right: s<P['right']>(right),
    gap: s<P['gap']>(1),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.center.value;
      p.left.value;
      p.right.value;
      p.gap.value;
    },
  };
  init?.(api);
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
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
        <div>{'HGrid'}</div>
        <div />
        <div>{'Horizontal Grid Layout'}</div>
      </div>

      <Button
        block
        label={`debug: ${p.debug.value ?? '<undefined>'}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={`gap: ${p.gap.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.gap, [1, 15, undefined])}
      />

      <hr />
      <DebugCenter debug={debug} />

      <hr />
      <ObjectView
        name={'props'}
        data={Signal.toObject(debug.props)}
        expand={{ level: 1, paths: ['$', '$.center'] }}
      />
    </div>
  );
};

/**
 * Component: <DebugCenter> options.
 */
export const DebugCenter: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  const btn = (
    label: string,
    fn: (e: { center: t.HGridCenterProps; clear(): void }) => t.IgnoredResult,
  ) => {
    return (
      <Button
        block
        label={label}
        onClick={() => {
          const signal = p.center;
          const center: t.HGridCenterProps = { ...(signal.value ?? {}) };
          let cleared = false;
          fn({ center, clear: () => (cleared = true) });
          signal.value = cleared ? undefined : center;
        }}
      />
    );
  };

  const align = (align: t.HGridColumn['align']) => {
    return btn(`align: ${align}`, (e) => (e.center.align = align));
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{'Column:'}</div>

      {btn('reset: <undefined>', (e) => e.clear())}

      <hr />
      {align('Left')}
      {align('Center')}
      {align('Right')}
    </div>
  );
};
