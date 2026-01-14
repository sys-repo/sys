import type { HarnessProps } from './t.ts';

import React from 'react';
import { type t, Str, Color, css, Dev, PlaybackDriver, ObjectView } from './common.ts';
import { Debug } from './ui.InfoPanel.Debug.tsx';

type L = NonNullable<HarnessProps['layout']>;

export type InfoPanelProps = {
  layout?: L['infopanel'];
  index?: t.Index;
  docid?: t.StringId;
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  snapshot?: t.TimecodeState.Playback.Snapshot;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { debug = false, index = -1, bundle, layout = {} } = props;
  const spec = bundle?.spec;

  /**
   * Hooks:
   */
  const { experience, resolved } = PlaybackDriver.Util.usePlaybackTimeline({ spec });
  const beat = index != null && experience?.beats[index] ? experience.beats[index] : undefined;
  const payload = beat?.payload;

  if (!experience) return null;
  if (!bundle) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      minHeight: 0,
      display: 'grid',
      gridTemplateRows: layout?.bottom ? `1fr auto` : `1fr`,
    }),
    top: {
      base: css({ position: 'relative', minHeight: 0 }),
      body: css({
        Absolute: 0,
        Scroll: true,
        Padding: [8, 15],
        fontSize: 12,
      }),
    },
    bottom: css({}),
    kv: css({ marginBottom: 30 }),
  };

  const elPayload = !!payload && (
    <ObjectView theme={theme.name} name={'payload'} data={payload} expand={1} />
  );

  const elInfo = (
    <Dev.InfoPanel.UI {...props} experience={experience} resolved={resolved} style={styles.kv} />
  );

  const elTop = (
    <div className={styles.top.base.class}>
      <div className={styles.top.body.class}>
        {elInfo}
        {elPayload}
        {debug && <Debug {...props} beat={beat} />}
      </div>
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
