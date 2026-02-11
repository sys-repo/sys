import React from 'react';
import { type t, Color, css, KeyValue } from './common.ts';
import { arraySize } from './u.data.ts';

export type PlaybackContentProps = {
  playback?: t.PlaybackContentData;
  loading?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PlaybackMain: React.FC<PlaybackContentProps> = (props) => {
  const { debug = false, loading = false } = props;
  const playback = props.playback;
  if (!playback) return null;

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

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: 'Playback Content' },
          { k: 'docid', v: playback.docid ?? '' },
          { k: 'assets', v: arraySize(playback.assets) },
          { k: 'beats', v: arraySize((playback.playback as { beats?: unknown })?.beats) },
        ]}
      />
      {loading ? <div>{'Loading content'}</div> : undefined}
    </div>
  );
};

/**
 * Component:
 */
export const PlaybackLeaf: React.FC<PlaybackContentProps> = (props) => {
  const { debug = false, loading = false } = props;
  const playback = props.playback;
  if (!playback) return null;

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

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: 'Leaf Playback' },
          { k: 'docid', v: playback.docid ?? '' },
          { k: 'assets', v: arraySize(playback.assets) },
          ...(loading ? [{ k: 'status', v: 'loading' }] : []),
        ]}
      />
    </div>
  );
};
