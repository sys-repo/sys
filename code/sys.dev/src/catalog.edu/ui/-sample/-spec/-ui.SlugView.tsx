import React from 'react';
import { type t, Color, css } from '../common.ts';
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
  console.log('slug', slug);

  const theme = Color.theme(props.theme);
  const recorders = slug.traits.filter((m) => m.id === 'video-recorder');

  /**
   * Render:
   */
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gap: 15,
    }),
  };

  const elRecorders = recorders.map((trait, i) => {
    const key = `${i}.${trait.id}:${trait.as}`;
    return <SlugViewVideoRecorder key={key} theme={theme.name} slug={slug} traitAlias={trait.as} />;
  });

  return <div className={css(styles.base, props.style).class}>{elRecorders} </div>;
};
