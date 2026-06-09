import React from 'react';
import { Bullet, Color, css, type t } from './common.ts';

type P = {
  status?: t.Service.State;
  theme?: t.CommonTheme;
  style?: t.Style.Input;
};

/**
 * Compact status marker for the title row.
 */
export const StatusTitle: React.FC<P> = (props) => {
  const status = props.status;
  if (!status) return null;

  const showLabel = status !== 'error';
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ display: 'flex', alignItems: 'center', gap: 6 }),
    label: css({ opacity: 0.7, fontWeight: 400 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {showLabel && <span className={styles.label.class}>{status}</span>}
      <Bullet
        theme={theme.name}
        size={7}
        selected
        filled
        selectedColor={statusColor(status, theme)}
      />
    </div>
  );
};

/**
 * Helpers:
 */
function statusColor(status: t.Service.State, theme: t.ColorTheme): t.StringHex {
  if (status === 'ready') return Color.GREEN;
  if (status === 'error') return Color.RED;
  if (status === 'starting' || status === 'stopping') return Color.YELLOW;
  return Color.alpha(theme.fg, 0.35);
}
