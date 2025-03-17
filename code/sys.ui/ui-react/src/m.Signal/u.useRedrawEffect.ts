import { useState } from 'react';
import { type t, Time, useSignalEffect } from './common.ts';

export const useRedrawEffect: t.SignalReactLib['useRedrawEffect'] = (cb) => {
  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);
  useSignalEffect(() => {
    cb();
    Time.delay(redraw);
  });
};
