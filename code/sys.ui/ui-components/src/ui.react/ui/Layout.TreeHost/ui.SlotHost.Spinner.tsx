import React from 'react';
import { type t, Color, css, Spinners } from './common.ts';

export type SpinnerProps = {
  config: t.TreeHost.SlotSpinner;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Spinner: React.FC<SpinnerProps> = (props) => {
  const { config } = props;
  const position = config.position ?? 'middle';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      padding: 30,
      pointerEvents: 'none',
      display: 'grid',
      justifyItems: 'center',
      alignItems: position === 'middle' ? 'center' : position === 'top' ? 'start' : 'end',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>
        <Spinners.Bar width={50} theme={theme.name} />
      </div>
    </div>
  );
};
