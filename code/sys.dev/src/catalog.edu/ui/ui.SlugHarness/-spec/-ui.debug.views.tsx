import React from 'react';
import { type t, Button, Color, css, Signal } from '../common.ts';
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
  const doc = debug.signals.doc.value;
  const isCurrent = (id: t.StringId) => p.main.value === id;

  /**
   * Handlers:
   */
  function handleClick(item?: t.SlugViewRegistryItem) {
    console.info('⚡️ clicked/item:', item);
  }

  /**
   * Effect: Update on
   */
  Signal.useRedrawEffect(debug.listen);

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
        block
        key={`${i}.${id}`}
        active={false} // NB: not-clickable → control from YAML editor.
        label={() => `main: ${id} ${isCurrent(id) ? '🌳' : ''}`}
        onClick={() => handleClick(item)}
      />
    );
  });

  return (
    <div className={css(styles.base, props.style).class}>
      {elButtons}
      <Button block label={() => `(none)`} onClick={() => handleClick(undefined)} />
    </div>
  );
};
