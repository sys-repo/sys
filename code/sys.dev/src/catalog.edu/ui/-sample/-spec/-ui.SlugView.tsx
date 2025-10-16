import React from 'react';

import { type t, Color, css, Slug } from '../common.ts';
import { SlugViewVideoRecorder } from './-ui.SlugView.VideoRecorder.tsx';

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

  const recorders = slug.traits.filter(Slug.Traits.Is.videoRecorderBinding);
  const elRecorders = recorders.map((trait, i) => {
    return (
      <SlugViewVideoRecorder
        key={`${i}.${trait.id}:${trait.as}`}
        slug={slug}
        traitAlias={trait.as}
        theme={theme.name}
      />
    );
  });

  return <div className={css(styles.base, props.style).class}>{elRecorders}</div>;
};
