import React from 'react';

import { type t, TimecodeState } from './common.ts';
import { createController } from './u.controller.ts';
import { createDriver } from './u.driver.ts';

type Input = t.TimecodeState.Playback.Input;
type Snapshot = t.TimecodeState.Playback.Snapshot;
const noop: t.TimecodePlaybackDriver.Driver = { apply: () => {}, dispose: () => {} };

export const usePlaybackDriver = (args: t.UsePlaybackDriverArgs): t.UsePlaybackDriverResult => {
  const { init, decks, resolveBeatMedia, schedule, log, onSnapshot } = args;
  const machine = TimecodeState.Playback;

  const [snapshot, setSnapshot] = React.useState<Snapshot>(() => machine.init(init));
  const [rev, setRev] = React.useState<t.NumberMonotonic>(0);

  const driverRef = React.useRef<t.TimecodePlaybackDriver.Driver>(noop);
  const snapshotRef = React.useRef<Snapshot>(snapshot);
  React.useEffect(() => void (snapshotRef.current = snapshot), [snapshot]);

  /**
   * Dispatch: reduce immediately, apply to driver, and publish to React.
   */
  const dispatch = React.useCallback(
    (input: Input) => {
      const next = machine.reduce(snapshotRef.current.state, input);
      snapshotRef.current = next;
      setSnapshot(next);
      setRev((n) => (n + 1) as t.NumberMonotonic);

      driverRef.current.apply(next);
    },
    [machine],
  );

  /**
   * Driver lifecycle (imperative runtime bridge).
   */
  React.useEffect(() => {
    if (!decks) return void (driverRef.current = noop);

    const driver = createDriver({ decks, schedule, log, dispatch, resolveBeatMedia });
    driverRef.current = driver;
    driver.apply(snapshotRef.current);

    return () => driver.dispose();
  }, [decks, resolveBeatMedia, schedule, log, dispatch]);

  React.useEffect(() => onSnapshot?.({ snapshot, rev }), [onSnapshot, snapshot, rev]);

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
