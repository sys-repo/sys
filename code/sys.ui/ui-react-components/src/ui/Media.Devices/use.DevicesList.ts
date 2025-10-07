import React from 'react';
import { type t, Rx } from './common.ts';
import { getDevices } from './u.getDevices.ts';

export const useDevicesList: t.UseMediaDevicesList = () => {
  const [items, setItems] = React.useState<MediaDeviceInfo[]>([]);

  /**
   * Effect:
   */
  React.useEffect(() => {
    const life = Rx.lifecycle();

    getDevices().then((list) => {
      if (life.disposed) return;
      setItems(list);
    });

    return life.dispose;
  }, []);

  // Finish up.
  return { items };
};
