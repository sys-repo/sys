import React from 'react';
import { type t, TimecodeState } from './common.ts';

type Args = {
  playback?: t.TimecodeState.Playback.Timeline;
  selectedIndex?: t.TimecodeState.Playback.BeatIndex;
  vTime?: t.Msecs;
};

export function useActivePhase(args: Args): 'media' | 'pause' | undefined {
  const { playback, selectedIndex, vTime } = args;

  return React.useMemo((): 'media' | 'pause' | undefined => {
    if (!playback) return undefined;
    if (selectedIndex == null || vTime == null) return undefined;

    return TimecodeState.Playback.activePhase(playback, selectedIndex, vTime);
  }, [playback, selectedIndex, vTime]);
}
