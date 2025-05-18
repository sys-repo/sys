import React from 'react';
import { type t, Button, Color, css, ObjectView, Signal } from '../u.ts';
import { D } from './common.ts';

type P = t.LayoutCenterColumnProps;

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
    center: css({ overflow: 'hidden' }),
    edge: css({
      backgroundColor: Color.alpha(Color.DARK, 0.04),
      display: 'grid',
      placeItems: 'center',
      userSelect: 'none',
    }),
  };

  const alignHandler = (align: t.CenterColumnAlign) => () => (p.align.value = align);
  const edgeDiv = (edge: t.CenterColumnAlign) => {
    return (
      <div className={styles.edge.class} onMouseDown={alignHandler(edge)}>
        {edge}
      </div>
    );
  };

  const elLeft = edgeDiv('Left');
  const elRight = edgeDiv('Right');
  const elCenter = (
    <div className={styles.center.class} onMouseDown={alignHandler('Center')}>
      <div style={{ padding: 10 }}>{'👋 Hello Center (Column)'}</div>
    </div>
  );

  const props = {
    debug: s<P['debug']>(true),
    theme: s<P['theme']>('Light'),

    left: s<P['left']>(elLeft),
    center: s<P['center']>(elCenter),
    right: s<P['right']>(elRight),

    centerWidth: s<P['centerWidth']>(),
    align: s<P['align']>(),
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
      p.align.value;
      p.centerWidth.value;
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

  const align = (align: t.CenterColumnAlign) => {
    return <Button block label={`align: ${align}`} onClick={() => (p.align.value = align)} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{'CenterColumn'}</div>
        <div />
        <div>{'Layout'}</div>
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

      <Button
        block
        label={`centerWidth: ${p.centerWidth.value ?? `<undefined> (${D.center.width})`}`}
        onClick={() => Signal.cycle(p.centerWidth, [0, 200, 600, undefined])}
      />

      <hr />
      {align('Left')}
      {align('Center')}
      {align('Right')}

      <hr />

      <Button
        block
        label={`reset`}
        onClick={() => {
          p.align.value = undefined;
          p.centerWidth.value = undefined;
        }}
      />

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(debug.props)} expand={1} />
    </div>
  );
};
