import { useCallback, useEffect, useRef, useState } from 'react';
import { type t, TimecodeState } from './common.ts';
import { Playback } from './mod.ts';

export const useRunner: t.TimecodePlaybackLib['useRunner'] = (args) => {
  const { runtime, initial, machine, onEvent, onCmd } = args;

  /**
   * Refs:
   */
  const runnerRef = useRef<t.PlaybackRunner | undefined>(undefined);

  /**
   * State:
   *    Avoid creating a runner during render (useState initializer),
   *    then immediately disposing/recreating it on first effect pass.
   *    Seed state from deterministic machine init instead.
   */
  const [snapshot, setSnapshot] = useState<t.PlaybackRunnerState>(() => {
    const lib = machine ?? TimecodeState.Playback;
    const state = initial ?? lib.init().state;
    return Playback.project.runnerState(state);
  });

  /**
   * Effects:
   *    Runner contract: per send() flush, runner publishes events
   *    before executing cmds before notifying subscribers.
   */
  useEffect(() => {
    // Recreate runner when the runtime/initial binding changes; Always dispose the previous runner.
    runnerRef.current?.dispose();

    const runner = Playback.runner({ runtime, initial, machine, onEvent, onCmd });
    runnerRef.current = runner;

    setSnapshot(runner.get());
    const unsubscribe = runner.subscribe((next) => setSnapshot(next));

    return () => {
      unsubscribe();
      runner.dispose();
      if (runnerRef.current === runner) runnerRef.current = undefined;
    };
  }, [runtime, initial, machine, onEvent, onCmd]);

  /**
   * API
   */
  const send = useCallback<t.PlaybackRunner['send']>((input) => {
    runnerRef.current?.send(input);
  }, []);

  return {
    snapshot,
    send,
  };
};
