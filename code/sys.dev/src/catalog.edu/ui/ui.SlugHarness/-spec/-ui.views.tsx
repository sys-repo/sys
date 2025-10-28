import React from 'react';
import { type t, Button, Color, css } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type SlugViewsProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SlugViews: React.FC<SlugViewsProps> = (props) => {
  const { debug } = props;
  const registry = debug.registry;
  const p = debug.props;
  const isCurrent = (id: t.StringId) => p.main.value === id;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  const elButtons = registry.list().map((item, i) => {
    const id = item.id;
    return (
      <Button
        key={`${i}.${id}`}
        block
        label={() => `main: ${id} ${isCurrent(id) ? '🌳' : ''}`}
        onClick={() => (p.main.value = id)}
      />
    );
  });

  return (
    <div className={css(styles.base, props.style).class}>
      {elButtons}
      <Button block label={() => `(none)`} onClick={() => (p.main.value = undefined)} />
    </div>
  );
};
