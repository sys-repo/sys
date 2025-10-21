import React from 'react';

import { type t, CrdtLayout, D } from './common.ts';
import { Config } from './ui.Config.tsx';
import { Main } from './ui.Main.tsx';

type P = t.VideoRecorderViewProps;

export const VideoRecorderView: React.FC<P> = (props) => {
  const { debug = false, crdt, signals, header = D.header, sidebar = D.sidebar } = props;

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
      crdt={crdt}
      signals={signals}
      header={header}
      sidebar={sidebar}
      slots={slots}
      debug={debug}
      style={props.style}
    />
  );
};
