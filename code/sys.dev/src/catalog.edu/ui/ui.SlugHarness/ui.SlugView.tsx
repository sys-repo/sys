import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Obj, Rx, Signal } from './common.ts';

/**
 * Component:
 */
export const SlugView: React.FC<t.SlugViewProps> = (props) => {
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

  const el = renderer?.({ view, slug, theme: theme.name });
  return <div className={css(styles.base, props.style).class}>{el}</div>;
};
