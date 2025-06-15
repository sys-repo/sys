import React from 'react';
import { type t, Button, Color, css, D, Icons, Spinners, usePointer } from './common.ts';

export type SuffixProps = {
  docId?: string;
  over?: boolean;
  spinning?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onPointer?: t.PointerEventsHandler;
  onClearClick?: () => void;
};

/**
 * Component:
 */
export const Suffix: React.FC<SuffixProps> = (props) => {
  const { docId, over, spinning = D.spinning } = props;
  const showClearBtn = docId && over && !spinning;
  const active = over && (spinning || showClearBtn);

  /**
   * Hooks:
   */
  const pointer = usePointer(props.onPointer);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      width: active ? 30 : 0,
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden',
    }),
    btn: css({ display: 'grid' }),
  };

  const elClearBtn = showClearBtn && (
    <Button style={styles.btn} onClick={props.onClearClick}>
      <Icons.Clear size={20} color={Color.BLUE} />
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      {spinning && <Spinners.Bar theme={theme.name} width={18} />}
      {elClearBtn}
    </div>
  );
};
