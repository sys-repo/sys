import React from 'react';
import { type t, D, LocalStorage, Signal } from './common.ts';

export const useController: t.HttpOrigin.UseController = (storage) => {
  const state = React.useMemo(() => {
    const store = LocalStorage.immutable<{ env?: t.HttpOriginBase.Env }>(storage, {
      env: D.env,
    });
    const env = Signal.create(store.current.env);
    return { env, store };
  }, [storage]);

  React.useEffect(() => {
    return Signal.effect(() => {
      state.store.change((d) => {
        d.env = state.env.value;
      });
    });
  }, [state]);

  return { env: state.env };
};
