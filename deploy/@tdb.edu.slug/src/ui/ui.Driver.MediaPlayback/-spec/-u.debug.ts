import {
  createDebugSignals as createBaseDebugSignals,
  type DebugSignals as BaseDebugSignals,
} from '../../ui.Driver.TreeContent/-spec/-SPEC.Debug.tsx';
import type { DevPlaybackRuntime } from './-u.playback.runtime.ts';
import type { t } from './common.ts';
import { Signal } from './common.ts';

type P = BaseDebugSignals;
type CreateArgs = Parameters<typeof createBaseDebugSignals>[0];

export type DebugSignals = Omit<P, 'props'> & {
  readonly props: P['props'] & {
    readonly runtime: t.Signal<DevPlaybackRuntime | undefined>;
  };
};

export async function createDebugSignals(args?: CreateArgs): Promise<DebugSignals> {
  const s = Signal.create;
  const base = await createBaseDebugSignals(args);

  const props = {
    ...base.props,
    runtime: s<DevPlaybackRuntime | undefined>(),
  };

  const api: DebugSignals = {
    ...base,
    props,
    reset,
  };

  function reset() {
    base.reset();
    props.runtime.value = undefined;
  }

  return api;
}
