import React from 'react';

import { type t, Rx } from './common.ts';
import { getDevices } from './u.getDevices.ts';
import { logMedia } from './u.logging.ts';

export const useDevicesList: t.UseMediaDevicesList = () => {
  const [items, setItems] = React.useState<MediaDeviceInfo[]>([]);

  React.useEffect(() => {
    const life = Rx.abortable();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      logMedia('MediaDevices not available in this environment.');
      return life.dispose;
    }

    const update = async () => {
      try {
        logMedia('Enumerating devices...');
        const list = await getDevices();
        if (life.disposed) return;
        setItems(list);
        logMedia(
          'Updated devices:',
          list.map((d) => `${d.kind}:${d.label}`),
        );
      } catch (err) {
        if (!life.disposed) logMedia('Device enumeration failed:', err);
      }
    };

    // Coalesce rapid devicechange bursts (hot-plug flurries)
    let timer: number | undefined;
    const onChange = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(update, 60); // small debounce to avoid flicker on quick succession events
    };

    // Initial populate
    update();
    navigator.mediaDevices.addEventListener('devicechange', onChange, { signal: life.signal });

    return () => {
      if (timer) clearTimeout(timer);
      life.dispose();
    };
  }, []);

  return { items };
};
