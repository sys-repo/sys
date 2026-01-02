import { useCallback, useEffect, useMemo, useReducer } from 'react';

import { type t } from './common.ts';
import { createController } from './u.playback.controller.ts';
import { createDriver } from './u.playback.driver.ts';

type Machine = t.TimecodeState.Playback.Lib;
type Input = t.TimecodeState.Playback.Input;
type Update = t.TimecodeState.Playback.Update;
type State = t.TimecodeState.Playback.State;
type CreateDriverArgs = Omit<Parameters<t.TimecodePlaybackDriverLib['create']>[0], 'dispatch'>;

export type UsePlaybackDriverArgs = CreateDriverArgs & {
  /**
   * Explicit machine value injection.
   * We intentionally do not assume a concrete import path for the machine object.
   */
  readonly machine: Machine;

  /** Optional init args forwarded to machine.init(...) */
  readonly init?: Parameters<Machine['init']>[0];
};

export type UsePlaybackDriverResult = {
  readonly state: State;
  readonly dispatch: (input: Input) => void;
  readonly controller: ReturnType<t.TimecodePlaybackDriverLib['controller']>;
};

/**
 * React integration:
 * - owns machine state via useReducer
 * - owns driver lifecycle
 * - applies machine updates → driver effects
 * - routes driver signals → machine inputs via dispatch(...)
 */
export const usePlaybackDriver = (args: UsePlaybackDriverArgs): UsePlaybackDriverResult => {
  const { machine, init, ...driverArgs } = args;

  const reducer = useCallback(
    (prev: Update, input: Input): Update => machine.reduce(prev.state, input),
    [machine],
  );

  const initUpdate = useCallback((): Update => machine.init(init), [machine, init]);

  const [update, dispatch0] = useReducer(reducer, undefined as unknown as Update, initUpdate);

  const dispatch = useCallback((input: Input) => dispatch0(input), [dispatch0]);

  const driver = useMemo(() => createDriver({ ...driverArgs, dispatch }), [driverArgs, dispatch]);

  // Apply machine outputs (cmds/events) into the runtime bridge.
  useEffect(() => void driver.apply(update), [driver, update]);

  // Own driver lifecycle.
  useEffect(() => () => driver.dispose(), [driver]);

  const controller = useMemo(() => createController(dispatch), [dispatch]);

  return {
    state: update.state,
    dispatch,
    controller,
  };
};
