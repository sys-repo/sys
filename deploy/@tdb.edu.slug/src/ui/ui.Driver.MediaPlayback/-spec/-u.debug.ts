import {
  createDebugSignals as createBaseDebugSignals,
  type DebugSignals as BaseDebugSignals,
} from '../../ui.Driver.TreeContent/-spec/-SPEC.Debug.tsx';
import type { PlaybackRuntime } from './-u.playback.runtime.ts';
import type { t } from './common.ts';
import { D, LocalStorage, Signal } from './common.ts';

type P = BaseDebugSignals;
type CreateArgs = Parameters<typeof createBaseDebugSignals>[0];
type Storage = { muted: boolean };
const DEFAULT_MUTED = true;
const defaults: Storage = { muted: DEFAULT_MUTED };

export type DebugSignals = Omit<P, 'props'> & {
  readonly props: P['props'] & {
    readonly runtime: t.Signal<PlaybackRuntime | undefined>;
    readonly muted: t.Signal<boolean>;
  };
};

export async function createDebugSignals(args?: CreateArgs): Promise<DebugSignals> {
  const s = Signal.create;
  const base = await createBaseDebugSignals(args);
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}:media-playback`, defaults);
  const snap = store.current;

  const localProps = {
    runtime: s<PlaybackRuntime | undefined>(),
    muted: s<boolean>(snap.muted ?? defaults.muted),
  };

  const props = {
    ...base.props,
    ...localProps,
  };

  const api: DebugSignals = {
    ...base,
    props,
    listen,
    reset,
  };

  function listen() {
    base.listen();
    Signal.listen(localProps, true);
  }

  function reset() {
    base.reset();
    props.runtime.value = undefined;
    props.muted.value = DEFAULT_MUTED;
  }

  Signal.effect(() => {
    store.change((d) => {
      d.muted = props.muted.value;
    });
  });

  return api;
}
