import type { t } from './common.ts';
import type * as R from './t.runtime.ts';

type Machine = t.TimecodeState.Playback.Lib;
type Input = t.TimecodeState.Playback.Input;
type State = t.TimecodeState.Playback.State;
type Update = t.TimecodeState.Playback.Update;
type CreateDriverArgs = Omit<R.CreatePlaybackDriverArgs, 'dispatch'>;

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
  readonly controller: R.TimelineController;
  readonly state: State;
  readonly update: Update;
  readonly dispatch: (input: Input) => void;
};
