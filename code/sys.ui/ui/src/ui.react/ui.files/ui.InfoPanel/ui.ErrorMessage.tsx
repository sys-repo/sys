import React from 'react';
import { Color, css, Err, type t } from './common.ts';

type P = {
  value: t.StdError;
  theme?: t.CommonTheme;
  style?: t.Style.Input;
};

/**
 * Render a minimal error message value with a native full-error tooltip.
 */
export const ErrorMessage: React.FC<P> = (props) => {
  const summary = Err.summary(props.value);
  const full = Err.summary(props.value, { cause: true, stack: true });
  const parts = splitSummary(summary);
  const theme = Color.theme(props.theme);

  const Styles = {
    base: css({ color: theme.fg, display: 'inline' }),
    name: css({ color: Color.RED, fontWeight: 'bold' }),
    message: css({ color: Color.alpha(theme.fg, 0.7) }),
  } as const;

  return (
    <div className={css(Styles.base, props.style).class} title={full}>
      <span className={Styles.name.class}>{parts.name}</span>
      {parts.message && <span className={Styles.message.class}>{` ${parts.message}`}</span>}
    </div>
  );
};

/**
 * Helpers:
 */
function splitSummary(summary: string) {
  const colon = summary.indexOf(':');
  if (colon < 0) return { name: summary, message: '' };
  return {
    name: summary.slice(0, colon + 1),
    message: summary.slice(colon + 1).trimStart(),
  };
}
