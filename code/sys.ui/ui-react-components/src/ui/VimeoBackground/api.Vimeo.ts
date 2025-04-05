import { type t, Time } from './common.ts';

/**
 * Vimeo simple IFrame/message API.
 */
export const Vimeo = {
  create(iframe: HTMLIFrameElement, options: { timeout?: t.Msecs } = {}): t.VimeoIFrame {
    const { timeout = 3_000 } = options;

    const api: t.VimeoIFrame = {
      post(method: string, value?: number | string) {
        const targetOrigin = '*'; // NB: Using "*" as targetOrigin is acceptable when not validating the origin.
        iframe?.contentWindow?.postMessage({ method, value }, targetOrigin);
      },
      get: {
        method<T>(method: string, dispose$: t.UntilInput) {
          return new Promise<T>((resolve, reject) => {
            const failWith = (message: string) => reject(new Error(message));
            const listener = (event: MessageEvent) => {
              if (event.origin !== 'https://player.vimeo.com') return; // Ignore: not the Vimeo player iframe.

              const data = event.data || {};
              if (data.method === method) {
                cleanup();
                resolve(data.value as T);
              }
            };

            window.addEventListener('message', listener);
            const cleanup = () => window.removeEventListener('message', listener);

            api.post(method);
            Time.until(dispose$).delay(timeout, () => {
              cleanup();
              failWith(`Timeout waiting for method: ${method}`);
            });
          });
        },

        currentTime(dispose$) {
          return api.get.method<number>('getCurrentTime', dispose$);
        },

        duration(dispose$) {
          return api.get.method<number>('getDuration', dispose$);
        },

        async time(dispose$) {
          const [current, duration] = await Promise.all([
            api.get.currentTime(dispose$),
            api.get.duration(dispose$),
          ]);
          return { current, duration };
        },
      },
    };
    return api;
  },
} as const;
