import React from 'react';
import { Traits } from '../../../m.slug.traits/mod.ts';
import { type t, Color, css, Slug } from '../common.ts';

export type SlugViewProps = {
  slug?: t.Slug;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SlugView: React.FC<SlugViewProps> = (props) => {
  const { debug = false, slug } = props;
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
      gap: 15,
    }),
  };

  const recorders = Slug.Has.traits(slug) ? slug.traits.filter(Traits.Is.videoRecorderBinding) : [];
  const elRecorders = recorders.map((trait, i) => {
    const key = `${i}.${trait.of}:${trait.as}`;
    return null;
  });

  return <div className={css(styles.base, props.style).class}>{elRecorders}</div>;
};
