import React from 'react';
import { type t, Color, css, Signal } from './-common.ts';

export type ProbeContainerProps = {
  debug: t.DebugSignals;
  sample: t.FetchSample;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const ProbeContainer: React.FC<ProbeContainerProps> = (props) => {
  const { debug, sample } = props;

  /**
   * Effects:
   */
  const v = Signal.toObject(debug.props);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: Color.MAGENTA,
      padding: 12,
      borderRadius: 4,
      border: `dashed 1px ${Color.alpha(theme.bg, 0.3)}`,
    }),
  };
  return (
    <div className={css(styles.base, props.style).class}>
      <div>{sample.title}</div>
    </div>
  );
};
