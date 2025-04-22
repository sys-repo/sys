import React from 'react';
import { Button } from '../Button/mod.ts';
import { ObjectView } from '../ObjectView/mod.ts';
import { type t, Color, css, D, Signal } from './common.ts';

type P = t.FadeElementProps;

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
  const props = {
    theme: s<t.CommonTheme>('Light'),
    children: s<P['children']>(),
    duration: s<P['duration']>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.children.value;
      p.duration.value;
    },
  };
  init?.(api);
  return api;
}

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
    title: css({
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
    el: css({ backgroundColor: Color.RUBY, Padding: [4, 10] }),
  };

  const renderElement = (label: string) => {
    return (
      <div key={label} className={styles.el.class}>
        {label}
      </div>
    );
  };

  const child1 = renderElement('One');
  const child2 = renderElement('Two');
  const child3 = renderElement('Three');

  const childrenButton = (label: string, children?: t.ReactNode) => {
    return <Button block label={() => label} onClick={() => (p.children.value = children)} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div>{'Fade.Element'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => `duration: ${p.duration.value ?? `<undefined> (${D.duration})`}`}
        onClick={() => Signal.cycle(p.duration, [100, 300, D.duration, 1500, undefined])}
      />

      <hr />
      {childrenButton(`children: <undefined>`, undefined)}
      {childrenButton(`children: {element} - 1`, child1)}
      {childrenButton(`children: {element} - 2`, child2)}
      {childrenButton(`children: {element} - [1, 2, 3]`, [child1, child2, child3])}
      {childrenButton(`children: string - 1`, '👋 hello')}
      {childrenButton(`children: string - 2`, '🐷')}
      {childrenButton(`children: number`, 123)}

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(p)} expand={1} />
    </div>
  );
};
