import type { t } from './common.ts';

/**
 * Vimeo simple IFrame/message API.
 */
export type VimeoIFrame = {
  post(method: string, value?: number | string): void;
  readonly get: {
    method<T>(method: string, dispose$?: t.UntilInput): Promise<T>;
    time(dispose$?: t.UntilInput): Promise<{ current: t.Secs; duration: t.Secs }>;
    currentTime(dispose$?: t.UntilInput): Promise<t.Secs>;
    duration(dispose$?: t.UntilInput): Promise<t.Secs>;
  };
};
