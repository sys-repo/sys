import React from 'react';
import { type t, Color, Crdt, css, Obj } from './common.ts';

/**
 * Component:
 */
export const SlugView: React.FC<t.SlugHarnessViewProps> = (props) => {
  const { debug = false, registry, doc, slugPath, docPath, slugView, slugProps } = props;

  if (!doc) return null;
  if (!registry) return null;
  if (!slugView) return null;
  if (!slugPath) return null;
  if (!docPath) return null;

  const renderer = registry?.get(slugView);
  if (!renderer) return null;

  const slugRoot = Obj.Path.get<t.Slug>(doc?.current, docPath);
  if (!slugRoot) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  const el = renderer?.({
    doc,
    slug: slugRoot,
    view: slugView,
    props: slugProps,
    path: { doc: docPath, slug: slugPath },
    theme: theme.name,
  });

  return <div className={css(styles.base, props.style).class}>{el}</div>;
};
