import React from 'react';
import { type t, Color, css, D, Spinners, Button, Icons } from './common.ts';
import { json } from 'node:stream/consumers';

export type SuffixProps = {
  doc?: t.CrdtRef;
  //
  over?: boolean;
  spinning?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onClearClick?: () => void;
};

/**
 * Component:
 */
export const Suffix: React.FC<SuffixProps> = (props) => {
  const { doc, spinning = D.spinning } = props;

  /**
   * Hooks:
   */
  const [isOverClear, setOverClear] = React.useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ width: 30, color: theme.fg, display: 'grid', placeItems: 'center' }),
    btn: css({
      display: 'grid',
      opacity: isOverClear ? 1 : theme.is.dark ? 0.3 : 0.2,
      transition: 'opacity 120ms ease',
    }),
  };

  const elClearBtn = doc && props.over && !spinning && (
    <Button style={styles.btn} onClick={props.onClearClick} onMouse={(e) => setOverClear(e.isOver)}>
      <Icons.Clear size={20} color={isOverClear ? Color.BLUE : theme.fg} />
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {spinning && <Spinners.Bar theme={theme.name} width={18} />}
      {elClearBtn}
    </div>
  );
};
