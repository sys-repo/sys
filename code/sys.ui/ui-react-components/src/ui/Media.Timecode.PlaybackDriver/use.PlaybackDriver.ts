import React from 'react';

import { type t, TimecodeState } from './common.ts';
import type { UsePlaybackDriverArgs, UsePlaybackDriverResult } from './t.hooks.ts';
import { createController } from './u.controller.ts';
import { createDriver } from './u.driver.ts';

type Input = t.TimecodeState.Playback.Input;
type Update = t.TimecodeState.Playback.Update;

export const usePlaybackDriver = (args: UsePlaybackDriverArgs): UsePlaybackDriverResult => {
  const { init, decks, resolveBeatMedia, schedule, log } = args;
  const machine = TimecodeState.Playback;

  const reducer = React.useCallback(
    (prev: Update, input: Input): Update => machine.reduce(prev.state, input),
    [machine],
  );

  const [update, send] = React.useReducer(reducer, init, (args) => machine.init(args));
  const dispatch = React.useCallback((input: Input) => send(input), [send]);

  const driver = React.useMemo(
    () => createDriver({ decks, resolveBeatMedia, schedule, log, dispatch }),
    [decks, resolveBeatMedia, schedule, log, dispatch],
  );

  const controller = React.useMemo(() => createController(dispatch), [dispatch]);

  React.useEffect(() => void driver.apply(update), [driver, update]);
  React.useEffect(() => () => driver.dispose(), [driver]);

  return {
    update,
    state: update.state,
    dispatch,
    controller,
  };
};
