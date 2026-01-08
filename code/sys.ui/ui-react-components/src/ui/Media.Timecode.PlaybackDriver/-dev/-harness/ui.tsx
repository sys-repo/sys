import React from 'react';
import type { HarnessProps } from './t.ts';

import { css, PlaybackDriver, Spinners } from './common.ts';
import { Orchestrated } from './ui.Orchestrated.tsx';

/**
 * Defers driver hook mounting until inputs are ready.
 */
export const Harness: React.FC<HarnessProps> = (props) => {
  const { bundle, decks } = props;
  const spec = bundle?.spec;

  /**
   * Timeline data (pure + cheap).
   */
  const timeline = PlaybackDriver.usePlaybackTimeline({ spec });
  const isReady = !!bundle && !!timeline.experience && !!decks;

  const styles = {
    spinner: css({
      height: '100%',
      display: 'grid',
      placeItems: 'center',
    }),
  };

  if (!isReady) {
    return (
      <div className={styles.spinner.class}>
        <Spinners.Bar theme={props.theme} />
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
