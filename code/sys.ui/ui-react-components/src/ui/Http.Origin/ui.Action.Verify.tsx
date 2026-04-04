import React from 'react';
import { type t, BarSpinner, Button, Color, css } from './common.ts';

export type VerifyActionProps = {
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
  const { debug = false, running = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      minWidth: 0,
      justifyItems: 'end',
    }),
    label: css({
      fontFamily: 'sans-serif',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {running ? (
        <BarSpinner theme={theme.name} width={30} />
      ) : (
        <Button
          theme={theme.name}
          label={<span className={styles.label.class}>{'Run Verification'}</span>}
          onClick={props.onVerify}
        />
      )}
    </div>
  );
};
