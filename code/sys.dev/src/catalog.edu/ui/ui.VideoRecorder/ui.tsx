import React from 'react';

import { type t, CrdtLayout, D } from './common.ts';
import { Config } from './ui.Config.tsx';
import { Main } from './ui.Main.tsx';

type P = t.VideoRecorderViewProps;

export const VideoRecorderView: React.FC<P> = (props) => {
  const {
    debug = false,
    crdt,
    signals,
    header = D.header,
    sidebar = D.sidebar,
    aspectRatio = D.aspectRatio,
  } = props;

  /**
   * Render:
   */
  const slots: t.CrdtLayoutSlots = {
    sidebar: (ctx) => <Config {...props} />,
    main: (ctx) => <Main {...props} />,
  };

  return (
    <CrdtLayout.View
      theme={props.theme}
      spinning={wrangle.spinning(props)}
      crdt={crdt}
      signals={signals}
      header={header}
      sidebar={sidebar}
      slots={slots}
      cropmarks={{
        size: { mode: 'percent', aspectRatio, width: 80 },
        borderOpacity: 0.05,
      }}
      debug={debug}
      style={props.style}
    />
  );
};

/**
 * Helpers:
 */
const wrangle = {
  spinning(props: P): t.CrdtLayoutSpinning {
    const { signals } = props;
    let main = false;
    if (!signals?.stream.value) main = true;
    return { main };
  },
} as const;
