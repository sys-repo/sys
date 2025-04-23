import React from 'react';
import { type t, Color, css, Playlist, LogoCanvas } from './common.ts';

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
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({ display: 'grid', alignContent: 'start' }),
    canvas: css({ Margin: [35, 60, 0, 60] }),
    playlist: css({ Margin: [0, 0, 0, 70], paddingTop: 50 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <LogoCanvas theme={theme.name} style={styles.canvas} />
        <Playlist items={media.children} theme={theme.name} style={styles.playlist} />
      </div>
    </div>
  );
};
