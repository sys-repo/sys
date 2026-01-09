import type { HarnessProps } from './t.ts';

import React from 'react';
import { type t, Color, css, PlaybackDriver } from './common.ts';
import { Debug } from './ui.InfoPanel.Debug.tsx';
import { KV } from './ui.InfoPanel.KV.tsx';

type L = NonNullable<HarnessProps['layout']>;

export type InfoPanelProps = {
  layout?: L['infopanel'];
  docid?: t.StringId;
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  beat?: t.Timecode.Experience.Beat;
  index?: t.Index;
  snapshot?: t.TimecodeState.Playback.Snapshot;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { debug = false, bundle, layout = {} } = props;
  const spec = bundle?.spec;

  /**
   * Hooks:
   */
  const { experience, resolved } = PlaybackDriver.usePlaybackTimeline({ spec });
  if (!experience) return null;
  if (!bundle) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: layout?.bottom ? `1fr auto` : `1fr`,
    }),
    kv: css({ marginBottom: 30 }),
    top: css({ Padding: [8, 15], fontSize: 12 }),
    bottom: css({}),
  };

  const elTop = (
    <div className={styles.top.class}>
      <KV {...props} experience={experience} resolved={resolved} style={styles.kv} />
      {debug && <Debug {...props} />}
    </div>
  );

  const elBottom = layout.bottom && <div className={styles.bottom.class}>{layout.bottom}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      {elTop}
      {elBottom}
    </div>
  );
};
