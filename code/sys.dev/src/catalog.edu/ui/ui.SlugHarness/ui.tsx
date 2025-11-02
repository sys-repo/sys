import React from 'react';
import { type t, Color, Crdt, D, Lens } from './common.ts';
import { SlugView } from './ui.SlugView.tsx';

type P = t.SlugHarnessProps;

export const SlugHarness: React.FC<P> = (props) => {
  const {
    debug = false,
    registry,
    crdt,
    signals,
    slugView,
    slugProps,
    header = D.header,
    sidebar = D.sidebar,
    docPath,
    slugPath,
  } = props;

  const doc = signals?.doc.value;
  const lens = wrangle.lenses(props);
  const cropmarks = lens.ui?.get()?.cropmarks;

  /**
   * Effects:
   */
  Crdt.UI.useRev(doc); // ← redraw on change

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const slots: t.CrdtView.LayoutSlots = {
    sidebar: (ctx) => <div>{`🐷 slug-harness sidebar`}</div>,
    main: (ctx) => {
      return (
        <SlugView
          doc={doc}
          registry={registry}
          slugView={slugView}
          slugPath={slugPath}
          slugProps={slugProps}
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
      cropmarks={{
        subjectOnly: !slugView ? true : cropmarks?.subjectOnly, // NB: render nothing when no view.
        size: cropmarks?.size,
      }}
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
    const doc = signals?.doc.value;
    return { main: !doc };
  },

  lenses(props: P) {
    const { signals, docPath, slugPath } = props;
    const doc = signals?.doc.value;
    const slug = doc ? Lens.at(doc, docPath, slugPath) : undefined;
    const ui = slug?.at<t.ViewRendererProps>(['data', 'ui']);
    return { slug, ui } as const;
  },
} as const;
