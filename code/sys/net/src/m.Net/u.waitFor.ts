import { type t } from './common.ts';

export const waitFor: t.NetLib['waitFor'] = (target) => {
  if (target instanceof WebSocket) {
    const ws = target;

    return new Promise<void>((resolve, reject) => {
      if (ws.readyState === WebSocket.OPEN) return resolve();

      const onOpen = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        resolve();
      };

      const onError = (err: Event) => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        reject(err);
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);
    });
  }

  // Runtime guard for future NetWaitTarget extensions.
  return Promise.reject(new Error('Net.waitFor: unsupported target'));
};
