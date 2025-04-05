import type { t } from './common.ts';

/**
 * Vimeo simple IFrame/message API.
 */
export type VimeoIFrameApi = {
  post(method: string, value?: number | string): void;
  readonly get: {
    method<T>(method: string, dispose$?: t.UntilInput): Promise<T>;
    currentTime(dispose$?: t.UntilInput): Promise<t.Secs>;
  };
};
