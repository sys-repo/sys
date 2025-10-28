import React from 'react';
import { type t, Color, Crdt, D } from './common.ts';
import { SlugView } from './ui.SlugView.tsx';

type P = t.SlugHarnessProps;

export const SlugHarness: React.FC<P> = (props) => {
  const {
    debug = false,
    registry,
    crdt,
    signals,
    main,
    header = D.header,
    sidebar = D.sidebar,
    docPath,
    slugPath,
  } = props;

  const doc = signals?.doc.value;
  Crdt.UI.useRev(doc); // ← redraw on change

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);

  const slots: t.CrdtView.LayoutSlots = {
    sidebar: (ctx) => '👋 sidebar',
    main: (ctx) => {
      return (
        <SlugView
          //
          doc={doc}
          registry={registry}
          view={main}
          slugPath={slugPath}
          docPath={docPath}
          theme={theme.name}
        />
      );
    },
  };

  return (
    <Crdt.UI.Layout.View
      theme={theme.name}
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
