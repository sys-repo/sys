import React from 'react';
import type { UsePlaybackDriverArgs, UsePlaybackDriverResult } from './t.hooks.ts';

import { type t, TimecodeState } from './common.ts';
import { createController } from './u.controller.ts';
import { createDriver } from './u.driver.ts';

type Input = t.TimecodeState.Playback.Input;
type Snapshot = t.TimecodeState.Playback.Snapshot;

export const usePlaybackDriver = (args: UsePlaybackDriverArgs): UsePlaybackDriverResult => {
  const { init, decks, resolveBeatMedia, schedule, log, onSnapshot } = args;
  const machine = TimecodeState.Playback;

  const [snapshot, setSnapshot] = React.useState<Snapshot>(() => machine.init(init));
  const snapshotRef = React.useRef<Snapshot>(snapshot);
  React.useEffect(() => void (snapshotRef.current = snapshot), [snapshot]);

  const noopDriver = React.useMemo<t.TimecodePlaybackDriver.Driver>(() => {
    return { apply: () => {}, dispose: () => {} };
  }, []);
  const driverRef = React.useRef<t.TimecodePlaybackDriver.Driver>(noopDriver);

  /**
   * Dispatch: reduce immediately, apply to driver, and publish to React.
   */
  const dispatch = React.useCallback(
    (input: Input) => {
      const next = machine.reduce(snapshotRef.current.state, input);
      snapshotRef.current = next;
      setSnapshot(next);
      driverRef.current.apply(next);
    },
    [machine],
  );

  /**
   * Driver lifecycle (imperative runtime bridge).
   */
  React.useEffect(() => {
    if (!decks) return void (driverRef.current = noopDriver);

    const driver = createDriver({ decks, schedule, log, dispatch, resolveBeatMedia });
    driverRef.current = driver;
    driver.apply(snapshotRef.current);

    return () => driver.dispose();
  }, [decks, resolveBeatMedia, schedule, log, dispatch, noopDriver]);
  React.useEffect(() => onSnapshot?.({ snapshot }), [onSnapshot, snapshot]);

  /**
   * UI controller surface (pure intent → reducer input).
   */
  const controller = React.useMemo(() => createController(dispatch), [dispatch]);

  return {
    controller,
    snapshot,
    dispatch,
  };
};
