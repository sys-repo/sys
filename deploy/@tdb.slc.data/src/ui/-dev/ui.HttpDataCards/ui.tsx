import React from 'react';
import { type t, Color, css, DEFAULTS, Signal } from './common.ts';
import { createPanel } from './u.panel.tsx';
import { createSignals } from './u.signals.ts';

export const HttpDataCards: t.FC<t.HttpDataCards.Props> = (props) => {
  const signals = React.useMemo(() => createSignals(), []);
  Signal.useRedrawEffect(() => Signal.listen(signals.props, true));
  const origin = props.origin ?? DEFAULTS.origin;
  const dataset = props.dataset ?? DEFAULTS.dataset;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      padding: 10,
    }),
  };

  return createPanel({
    signals,
    origin,
    dataset,
    docid: props.docid,
    debug: props.debug,
    theme: props.theme,
    style: css(styles.base, props.style),
  });
};
