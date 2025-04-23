import React from 'react';
import { type t, Color, css } from './common.ts';
import { Playlist } from './ui.Playlist.tsx';

export type SectionProps = {
  media: t.VideoMediaContent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Section: React.FC<SectionProps> = (props) => {
  const { media } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Padding: [15, 30],
      color: theme.fg,
      display: 'grid',
    }),
    body: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <Playlist items={media.children} theme={theme.name} />
      </div>
    </div>
  );
};
