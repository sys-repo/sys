import React from 'react';
import { Factory } from '../m.Factory/mod.ts';
import { type t, Color, css } from './common.ts';
import { RoundedButton } from './ui.Button.Rounded.tsx';

export type ButtonsProps = {
  state: t.AppSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Buttons: React.FC<ButtonsProps> = (props) => {
  const { state } = props;

  /**
   * Handlers:
   */
  const stack = state.stack;
  const showTrailer = async () => stack.push(await Factory.trailer());
  const showOverview = async () => stack.push(await Factory.overview());

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: `auto auto`,
      columnGap: '15px',
    }),
    button: css({
      Padding: [15, 40],
      borderRadius: 40,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <RoundedButton theme={theme.name} label={'Trailer'} onClick={showTrailer} />
      <RoundedButton theme={theme.name} label={'Overview'} onClick={showOverview} />
    </div>
  );
};
