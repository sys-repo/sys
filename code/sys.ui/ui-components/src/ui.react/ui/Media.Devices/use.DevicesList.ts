import React from 'react';
import { type t, logInfo, Rx, Time, Try } from './common.ts';
import { getDevices } from './u.getDevices.ts';
import { useBootstrapMediaPermissions } from './use.Bootstrap.ts';

export const useDevicesList: t.UseMediaDevicesList = () => {
  const [items, setItems] = React.useState<MediaDeviceInfo[]>([]);
  const refreshRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    const life = Rx.abortable();
    const time = Time.until(life);
    const { signal } = life;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      logInfo('MediaDevices not available in this environment.');
      return life.dispose;
    }

    let seq = 0; //           Guard against out-of-order updates.
    let pending = false; //   Coalesce re-entrant calls.
    let delayed: t.Cancellable | undefined;

    const update = async () => {
      if (pending) return;
      pending = true;
      const mySeq = ++seq;

      const { result } = await Try.run(async () => getDevices());
      if (life.disposed || mySeq !== seq) {
        pending = false;
        return;
      }

      if (!result.ok) {
        logInfo('Device enumeration failed:', result.error);
        pending = false;
        return;
      }

      const list = result.data;
      setItems(list);
      logInfo(
        'Devices updated:',
        list.map((d) => `${d.kind}:${d.label}`),
      );
      pending = false;
    };

    const onChange = () => {
      // Calm cadence for virtual drivers; enumeration itself doesn’t open devices.
      delayed?.cancel();
      delayed = time.delay(180, () => void update());
    };

    navigator.mediaDevices.addEventListener('devicechange', onChange, { signal });
    void update(); // Initial populate.

    // Provide a stable "refresh" function for the bootstrap hook to call.
    refreshRef.current = () => {
      if (life.disposed) return;
      delayed?.cancel();
      delayed = time.delay(50, () => void update());
    };

    return life.dispose;
  }, []);

  /**
   * Hook:bootstrap:
   *    Camera/Mic permissions
   *    Triggers a one-time getUserMedia when devices have empty labels.
   */
  useBootstrapMediaPermissions({
    items,
    onAfterBootstrap: () => void refreshRef.current(),
  });

  /**
   * API:
   */
  return { items };
};
