import React from 'react';
import { type t, Crdt, D } from './common.ts';

type P = t.ConceptPlayerProps;

export const ConceptPlayer: React.FC<P> = (props) => {
  const {
    debug = false,
    crdt,
    signals,
    header = D.header,
    sidebar = D.sidebar,
    docPath,
    slugPath,
  } = props;


  /**
   * Render:
   */

  const slots: t.CrdtView.LayoutSlots = {
    sidebar: (ctx) => '👋 sidebar',
    main: (ctx) => '👋 main concept',
  };

  return (
    <Crdt.UI.Layout.View
      theme={props.theme}
      spinning={wrangle.spinning(props)}
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

/**
 * Helpers:
 */
const wrangle = {
  spinning(props: P): t.CrdtView.LayoutSpinning {
    const { signals } = props;
    return {};
  },
} as const;
