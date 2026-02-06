import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './-common.ts';

export function createEntry(debug: t.DebugSignals, sample: t.FetchSample, index: t.Index) {
  return <ProbeContainer key={index} debug={debug} sample={sample} />;
}

/**
 * Internal:
 */
type ProbeContainerProps = {
  debug: t.DebugSignals;
  sample: t.FetchSample;
  style?: t.CssValue;
};

function ProbeContainer(props: ProbeContainerProps) {
  const { debug, sample } = props;

  const v = Signal.toObject(debug.props);
  Signal.useRedrawEffect(debug.listen);

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
}
