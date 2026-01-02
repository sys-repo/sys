import type { t } from './common.ts';

type Machine = t.TimecodeState.Playback.Lib;
type Input = t.TimecodeState.Playback.Input;
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
