import React from 'react';
import { type t, Color, Cropmarks, css, KeyValue, Obj, ObjectView } from './common.ts';
import { arraySize } from './u.data.ts';

export type PlaybackContentProps = {
  playback?: t.PlaybackContentData;
  loading?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PlaybackMain: React.FC<PlaybackContentProps> = (props) => {
  const { playback } = props;
  if (!playback) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({ color: theme.fg, display: 'grid' }) };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.03}>
        <InfoPanel {...props} style={{ margin: 15, width: 400 }} />
      </Cropmarks>
    </div>
  );
};

/**
 * Component:
 */
export const PlaybackLeaf: React.FC<PlaybackContentProps> = (props) => {
  const { playback } = props;
  if (!playback) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      padding: 20,
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <InfoPanel {...props} showObject={false} />
    </div>
  );
};

/**
 * Component: Information Panel.
 */
type InfoPanelProps = PlaybackContentProps & { showObject?: boolean };
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { loading = false, showObject = false, playback } = props;
  if (!playback) return null;

  const data = {
    playback: playback.playback,
    assets: playback.assets,
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 25,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: 'MediaPlayback Content' },
          { k: 'docid', v: playback.playback.docid },
          { k: 'assets', v: arraySize(playback.assets) },
          { k: 'beats', v: arraySize(playback.playback.beats) },
          ...(loading ? [{ k: 'status', v: 'loading' }] : []),
        ]}
      />
      {showObject && (
        <ObjectView
          theme={theme.name}
          name={'playback'}
          data={Obj.truncateStrings(data, 40)}
          expand={0}
        />
      )}
    </div>
  );
};
