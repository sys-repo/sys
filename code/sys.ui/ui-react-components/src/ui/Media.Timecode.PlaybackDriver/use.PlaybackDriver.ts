import React from 'react';
import type { UsePlaybackDriverArgs, UsePlaybackDriverResult } from './t.hooks.ts';

import { type t, TimecodeState } from './common.ts';
import { createController } from './u.controller.ts';
import { createDriver } from './u.driver.ts';

type Input = t.TimecodeState.Playback.Input;
type Snapshot = t.TimecodeState.Playback.Snapshot;

export const usePlaybackDriver = (args: UsePlaybackDriverArgs): UsePlaybackDriverResult => {
  const { init, decks, resolveBeatMedia, schedule, log } = args;
  const machine = TimecodeState.Playback;
  const [driverTick, setDriverTick] = React.useState(0);

  // Reducer wiring (pure state machine).
  const reducer = React.useCallback(
    (prev: Snapshot, input: Input) => machine.reduce(prev.state, input),
    [machine],
  );
  const [snapshot, send] = React.useReducer(reducer, init, (args) => machine.init(args));
  const dispatch = React.useCallback((input: Input) => send(input), [send]);
  const noopDriver = React.useMemo<t.TimecodePlaybackDriver.Driver>(() => {
    return { apply: () => {}, dispose: () => {} };
  }, []);

  // UI controller surface (pure intent → reducer input).
  const controller = React.useMemo(() => createController(dispatch), [dispatch]);

  // Driver lifecycle (imperative runtime bridge).
  const driverRef = React.useRef<t.TimecodePlaybackDriver.Driver>(noopDriver);
  React.useEffect(() => {
    if (!decks) return void (driverRef.current = noopDriver);

    const driver = createDriver({ decks, schedule, log, dispatch, resolveBeatMedia });
    driverRef.current = driver;
    setDriverTick((n) => n + 1);

    return () => driver.dispose();
  }, [decks, resolveBeatMedia, schedule, log, dispatch, noopDriver]);

  // Apply reducer snapshots to the runtime driver.
  React.useEffect(() => void driverRef.current.apply(snapshot), [snapshot, driverTick]);

  return {
    controller,
    snapshot,
    dispatch,
  };
};
