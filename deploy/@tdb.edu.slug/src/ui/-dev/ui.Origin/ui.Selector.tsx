import React from 'react';
import { type t, Bullet, Button, Color, css, D } from './common.ts';

export type OriginSelectorProps = {
  kind?: t.DevOriginKind;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: t.DevOriginProps['onOriginChange'];
};

/**
 * Component:
 */
export const OriginSelector: React.FC<OriginSelectorProps> = (props) => {
  const { debug = false, kind = D.kind.default } = props;

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
      alignItems: 'center',
      gap: 8,
    }),
  };

  const btn = (value: t.DevOriginKind) => {
    const label = `${value}`;
    const isSelected = value === kind;
    return (
      <Button theme={theme.name} onMouseDown={() => props.onChange?.({ next: value })}>
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
