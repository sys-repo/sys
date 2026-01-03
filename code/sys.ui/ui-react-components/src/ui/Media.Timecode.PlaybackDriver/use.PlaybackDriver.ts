import React from 'react';

import { type t, TimecodeState } from './common.ts';
import type { UsePlaybackDriverArgs, UsePlaybackDriverResult } from './t.hooks.ts';
import { createController } from './u.controller.ts';
import { createDriver } from './u.driver.ts';

type Input = t.TimecodeState.Playback.Input;
type Snapshot = t.TimecodeState.Playback.Snapshot;

export const usePlaybackDriver = (args: UsePlaybackDriverArgs): UsePlaybackDriverResult => {
  const { init, decks, resolveBeatMedia, schedule, log } = args;
  const machine = TimecodeState.Playback;

  const reducer = React.useCallback(
    (prev: Snapshot, input: Input): Snapshot => machine.reduce(prev.state, input),
    [machine],
  );

  const [snapshot, send] = React.useReducer(reducer, init, (args) => machine.init(args));
  const dispatch = React.useCallback((input: Input) => send(input), [send]);

  const noopDriver = React.useMemo<t.TimecodePlaybackDriver.Driver>(() => {
    return {
      apply: () => {},
      dispose: () => {},
    };
  }, []);

  const driver = React.useMemo(() => {
    if (!decks) return noopDriver;
    return createDriver({ decks, resolveBeatMedia, schedule, log, dispatch });
  }, [decks, resolveBeatMedia, schedule, log, dispatch, noopDriver]);

  const controller = React.useMemo(() => createController(dispatch), [dispatch]);
  React.useEffect(() => void driver.apply(snapshot), [driver, snapshot]);
  React.useEffect(() => () => driver.dispose(), [driver]);

  return {
    snapshot,
    dispatch,
    controller,
  };
};
