import React from 'react';
import { type t, BarSpinner, Button, Color, css } from './common.ts';

export type VerifyActionProps = {
  label?: string;
  running?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onVerify?: () => void;
};

/**
 * Component:
 */
export const VerifyAction: React.FC<VerifyActionProps> = (props) => {
  const { debug = false, running = false, label = 'run verification' } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      alignItems: 'center',
      minWidth: 0,
    }),
    action: css({ display: 'grid', justifyItems: 'end', minWidth: 0 }),
    label: css({ fontFamily: 'sans-serif' }),
  };

  const elLabel = <span className={styles.label.class}>{label}</span>;
  const elSpinner = <BarSpinner theme={theme.name} width={30} />;
  const elButton = <Button theme={theme.name} label={elLabel} onClick={props.onVerify} />;
  const elAction = running ? elSpinner : elButton;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.action.class}>{elAction}</div>
    </div>
  );
};
