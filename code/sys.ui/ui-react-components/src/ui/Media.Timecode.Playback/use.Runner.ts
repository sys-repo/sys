import React from 'react';
import { type t } from './common.ts';
import { Playback } from './mod.ts';

export const useRunner: t.TimecodePlaybackLib['useRunner'] = (args) => {
  const runnerRef = React.useRef<t.PlaybackRunner | undefined>(undefined);

  /**
   * Hooks:
   */
  const [snapshot, setSnapshot] = React.useState<t.PlaybackRunnerState>(() => {
    const runner = Playback.runner(args);
    runnerRef.current = runner;
    return runner.get();
  });

  /**
   * Effects:
   */
  React.useEffect(() => {
    /**
     * Recreate runner when the runtime/initial binding changes.
     * Always dispose the previous runner.
     */
    runnerRef.current?.dispose();
    const runner = Playback.runner(args);
    runnerRef.current = runner;

    setSnapshot(runner.get());
    const unsubscribe = runner.subscribe((next) => setSnapshot(next));

    return () => {
      unsubscribe();
      runner.dispose();
      if (runnerRef.current === runner) runnerRef.current = undefined;
    };
  }, [args.runtime, args.initial]);

  const send = React.useCallback<t.PlaybackRunner['send']>((input) => {
    runnerRef.current?.send(input);
  }, []);

  /**
   * API:
   */
  return { snapshot, send };
};
