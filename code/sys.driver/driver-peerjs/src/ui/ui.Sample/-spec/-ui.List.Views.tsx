import React from 'react';
import { type t, Bullet, Button, Color, css } from '../common.ts';

export type ViewsListProps = {
  enabled?: boolean;
  current?: t.SampleView;
  show?: t.SampleView[];

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onSelect?: SelectModeHandler;
};

export type SelectModeHandler = (e: SelectMode) => void;
export type SelectMode = { mode: t.SampleView };

const ALL_VIEWS: t.SampleView[] = ['Off', 'Debug', 'Notes', 'FileShare'];

/**
 * Component:
 */
export const ViewsList: React.FC<ViewsListProps> = (props) => {
  const { enabled = true, current = 'Debug', onSelect, show = ALL_VIEWS } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      opacity: enabled ? 1 : 0.2,
      transition: `opacity 120ms ease`,
      pointerEvents: enabled ? 'auto' : 'none',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {show.map((mode, i) => {
        return <Item key={`${mode}.${i}`} mode={mode} current={current} onSelect={onSelect} />;
      })}
    </div>
  );
};

/**
 * Helpers:
 */
export function Item(props: {
  mode: t.SampleView;
  current?: t.SampleView;
  onSelect?: SelectModeHandler;
}) {
  const { mode, current, onSelect } = props;
  const isSelected = mode === current;
  const styles = {
    base: css({
      margin: 1,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignItems: 'center',
      columnGap: 10,
    }),
  };
  return (
    <div key={mode} className={styles.base.class}>
      <Bullet selected={isSelected} />
      <Button block label={() => mode} onClick={() => onSelect?.({ mode })} />
    </div>
  );
}
