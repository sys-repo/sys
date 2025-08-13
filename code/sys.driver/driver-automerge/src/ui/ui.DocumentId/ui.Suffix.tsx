import React from 'react';
import { type t, Color, css, D, Spinners, usePointer } from './common.ts';

export type SuffixProps = {
  docId?: string;
  over?: boolean;
  spinning?: boolean;
  enabled?: boolean;
  readOnly?: boolean;
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
  const { docId, over, spinning = D.spinning, enabled = D.enabled, readOnly = D.readOnly } = props;
  const showClearBtn = docId && over && !spinning && !readOnly;
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
  };

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      {spinning && <Spinners.Bar theme={theme.name} width={18} style={{ pointerEvents: 'none' }} />}
    </div>
  );
};
