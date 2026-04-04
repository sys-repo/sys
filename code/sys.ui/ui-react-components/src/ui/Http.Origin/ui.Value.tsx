import React from 'react';
import { type t, A, Color, css, Icons, Str } from './common.ts';

export type ValueProps = {
  url: t.StringUrl;
  verified?: boolean;
  reserveStatusSpace?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Value: React.FC<ValueProps> = (props) => {
  const { debug = false } = props;
  const label = Str.trimHttpScheme(props.url);
  const showStatusSlot = props.reserveStatusSpace || props.verified !== undefined;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: showStatusSlot ? '1fr auto' : '1fr',
      alignItems: 'center',
      columnGap: showStatusSlot ? 8 : 0,
      minWidth: 0,
    }),
    anchor: css({
      color: 'inherit',
      display: 'block',
      minWidth: 0,
      textAlign: 'right',
    }),
    status: css({
      display: 'grid',
      placeItems: 'center',
      width: 14,
      minWidth: 14,
      opacity: 0.7,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <A href={props.url} style={styles.anchor}>
        {label}
      </A>
      {showStatusSlot && <div className={styles.status.class}>{renderStatusIcon(props)}</div>}
    </div>
  );
};

function renderStatusIcon(props: ValueProps) {
  if (props.verified === true) return <Icons.Check size={12} color={Color.GREEN} />;
  if (props.verified === false) return <Icons.Error.Solid size={12} color={Color.RED} />;
  return null;
}
