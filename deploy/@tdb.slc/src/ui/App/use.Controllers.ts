import { useEffect, useState } from 'react';
import { type t } from './common.ts';
import { App } from './m.App.ts';
import { useDist } from './use.Dist.ts';

export function useControllers(state?: t.AppSignals) {
  const [controller, setController] = useState<t.AppController>();

  useDist(state);

  useEffect(() => {
    if (!state) return;
    const ctrl = App.Signals.Controllers.start(state);
    setController(ctrl);
    return ctrl.dispose;
  }, [state]);

  return controller;
}
