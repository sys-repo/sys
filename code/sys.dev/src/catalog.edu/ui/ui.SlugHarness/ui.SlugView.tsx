import React from 'react';
import { type t, Color, css, Obj } from './common.ts';

/**
 * Component:
 */
export const SlugView: React.FC<t.SlugHarnessViewProps> = (props) => {
  const { debug = false, doc, slugPath, docPath, view, registry } = props;

  if (!doc) return null;
  if (!registry) return null;
  if (!view) return null;
  if (!slugPath) return null;
  if (!docPath) return null;

  const renderer = registry?.get(view);
  if (!renderer) return null;

  const slug = Obj.Path.get<t.Slug>(doc?.current, docPath);
  if (!slug) return null;

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

  const m: t.SlugViewProps = {
    view,
    slug,
    path: { doc: docPath, slug: slugPath },
    doc,
    theme: theme.name,
  };

  const el = renderer?.(m);
  return <div className={css(styles.base, props.style).class}>{el}</div>;
};
