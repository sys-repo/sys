import React from 'react';
import { type t, A, Color, css, Icons, Str } from './common.ts';
import { usePulse } from './use.Pulse.ts';

export type ValueProps = {
  url: t.StringUrl;
  status?: t.HttpOrigin.VerifyStatus;
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
  const hasResolvedStatus = props.status === 'ok' || props.status === 'error';
  const showStatusSlot = props.reserveStatusSpace || hasResolvedStatus;
  const isRunning = props.status === 'running';
  const opacity = usePulse(isRunning);

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
      columnGap: showStatusSlot ? 3 : 0,
      minWidth: 0,
      opacity,
      transition: isRunning ? 'opacity 800ms ease-in-out' : 'opacity 120ms ease',
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
      <A href={props.url} enabled={!isRunning} disabledOpacity={false} style={styles.anchor}>
        {label}
      </A>
      {showStatusSlot && <div className={styles.status.class}>{renderStatusIcon(props)}</div>}
    </div>
  );
};

function renderStatusIcon(props: ValueProps) {
  if (props.status === 'ok') return <Icons.Check size={12} color={Color.GREEN} />;
  if (props.status === 'error') return <Icons.Close size={12} color={Color.RED} />;
  return null;
}
