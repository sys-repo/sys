import React from 'react';
import { type t, DataClient, Signal } from './common.ts';

export const useController: t.Mounts.UseController = (args) => {
  const state = React.useMemo<t.Mounts.ControllerState>(() => {
    return {
      loading: Signal.create(false),
      error: Signal.create<string | undefined>(undefined),
      mounts: Signal.create<readonly t.SlugMounts.Entry[] | undefined>(undefined),
      selected: Signal.create<t.StringId | undefined>(args.selected),
    };
  }, []);
  const onSelectRef = React.useRef(args.onSelect);

  React.useEffect(() => {
    onSelectRef.current = args.onSelect;
  }, [args.onSelect]);

  React.useEffect(() => {
    state.selected.value = args.selected;
  }, [args.selected, state.selected]);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      state.loading.value = true;
      state.error.value = undefined;

      const res = await DataClient.Mounts.load(args.origin);
      if (cancelled) return;

      state.loading.value = false;

      if (!res.ok) {
        state.mounts.value = [];
        state.error.value = res.error.message;
        return;
      }

      const mounts = res.value.mounts;
      state.mounts.value = mounts;

      const selected = state.selected.value;
      const exists = selected ? mounts.some((m) => m.mount === selected) : false;
      if (exists) return;

      const first = mounts[0]?.mount;
      state.selected.value = first;
      if (first) onSelectRef.current?.(first);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [args.origin, state.error, state.loading, state.mounts, state.selected]);

  return state;
};
