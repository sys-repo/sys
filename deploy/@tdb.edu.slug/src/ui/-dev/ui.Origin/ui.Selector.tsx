import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Bullet, Button, Signal, D, Rx, Obj, Str, Is } from './common.ts';

export type OriginSelectorProps = {
  origin?: t.DevOriginKind;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: t.DevOriginProps['onOriginChange'];
};

/**
 * Component:
 */
export const OriginSelector: React.FC<OriginSelectorProps> = (props) => {
  const { debug = false, origin = D.origin.default } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      lineHeight: 1.8,
      color: theme.fg,
      display: 'grid',
    }),
    button: css({
      display: 'grid',
      gridTemplateColumns: `auto 1fr`,
      gap: 8,
      alignItems: 'center',
    }),
  };

  const btn = (kind: t.DevOriginKind) => {
    const label = `${kind}`;
    const isSelected = kind === origin;
    return (
      <Button theme={theme.name} onMouseDown={() => props.onChange?.({ next: kind })}>
        <div className={styles.button.class}>
          <Bullet theme={theme.name} selected={isSelected} />
          <div>{label}</div>
        </div>
      </Button>
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {btn('localhost')}
      {btn('production')}
    </div>
  );
};
