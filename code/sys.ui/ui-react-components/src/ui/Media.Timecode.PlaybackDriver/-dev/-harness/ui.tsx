import React from 'react';
import type { HarnessProps } from './t.ts';

import { css, PlaybackDriver } from './common.ts';
import { Orchestrated } from './ui.Orchestrated.tsx';

/**
 * Defers driver hook mounting until inputs are ready.
 */
export const Harness: React.FC<HarnessProps> = (props) => {
  const { bundle, decks, url } = props;
  const spec = bundle?.spec;

  /**
   * Timeline data (pure + cheap).
   */
  const timeline = PlaybackDriver.Util.usePlaybackTimeline({ spec });
  const isReady = !!bundle && !!timeline.experience && !!decks;

  const styles = {
    empty: {
      base: css({
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        gap: 6,
      }),
      msg: css({
        fontSize: 18,
        lineHeight: 1.9,
        userSelect: 'none',
      }),
      url: css({
        fontSize: 16,
        opacity: 0.25,
        fontFamily: 'monospace',
        userSelect: 'auto',
      }),
    },
  };

  if (!isReady) {
    return (
      <div className={styles.empty.base.class}>
        <div>
          <div
            className={styles.empty.msg.class}
          >{`Please ensure timeline json can be loaded (from endpoint):`}</div>
          {url && <div className={styles.empty.url.class}>{url}</div>}
        </div>
      </div>
    );
  }

  return (
    <Orchestrated
      //
      {...props}
      timeline={timeline}
      experience={timeline.experience}
    />
  );
};
