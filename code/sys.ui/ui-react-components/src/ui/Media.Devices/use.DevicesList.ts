import React, { useEffect } from 'react';
import { type t, rx } from './common.ts';
import { getDevices } from './u.getDevices.ts';

export const useDevicesList: t.UseMediaDevicesList = () => {
  const [items, setItems] = React.useState<MediaDeviceInfo[]>([]);

  /**
   * Effect:
   */
  useEffect(() => {
    const life = rx.lifecycle();

    getDevices().then((list) => {
      if (life.disposed) return;
      setItems(list);
    });

    return life.dispose;
  }, []);

  // Finish up.
  return { items };
};
