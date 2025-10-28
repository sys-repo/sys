import React from 'react';
import { type t, Crdt, D, Obj } from './common.ts';

type P = t.SlugHarnessProps;

export const SlugHarness: React.FC<P> = (props) => {
  const {
    debug = false,
    registry,
    crdt,
    signals,
    view,
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
  const slots: t.CrdtView.LayoutSlots = {
    sidebar: (ctx) => '👋 sidebar',
    main: (ctx) => {
      if (!slugPath || !docPath || !view) return null;

      const renderer = registry?.get(view);
      if (!renderer) return null;

      const slug = Obj.Path.get<t.Slug>(doc?.current, docPath);
      if (!slug) return null;

      return renderer?.({ view, slug });
    },
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
