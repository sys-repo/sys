import React from 'react';
import { type t, Color, css, VideoPlayer } from './common.ts';

/**
 * Component.
 */
export const ConceptPlayer: React.FC<t.ConceptPlayerProps> = (props) => {
  const {} = props;
  const timestamps = wrangle.timestamps(props);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <VideoPlayer title={props.title} video={props.video} />
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  timestamps(props: t.ConceptPlayerProps) {
    const { timestamps } = props;
    if (typeof timestamps !== 'object') return {};
    return timestamps;
  },
} as const;
