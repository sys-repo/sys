import React from 'react';
import { type t, Color, css, Button } from './common.ts';

import { Factory } from '../m.Factory/mod.ts';
import { RoundedButton } from './ui.Button.Rounded.tsx';

/**
 * Component: Intro - "Trailer" | "Overview" (Buttons)
 */
export type IntroButtonsProps = {
  state: t.AppSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
export const IntroButtons: React.FC<IntroButtonsProps> = (props) => {
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
      <RoundedButton theme={theme.name} label={'Trailer'} onClick={showTrailer} pulse />
      <RoundedButton theme={theme.name} label={'Overview'} onClick={showOverview} />
    </div>
  );
};

/**
 * Component: Start Programme (Button).
 */
export type StartProgrammeButtonProps = {
  state: t.AppSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
export const StartProgrammeButton: React.FC<StartProgrammeButtonProps> = (props) => {
  const { state } = props;

  /**
   * Handlers:
   */
  const stack = state.stack;
  const enterProgramme = async () => stack.push(await Factory.programme());

  /**
   * Render:
   */
  return <Button label={'Start Programme'} theme={props.theme} onClick={enterProgramme} />;
};
