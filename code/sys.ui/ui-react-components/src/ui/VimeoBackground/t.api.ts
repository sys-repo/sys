import type { t } from './common.ts';

/**
 * Vimeo simple IFrame/message API.
 */
export type VimeoIFrame = {
  post(method: string, value?: number | string): void;
  readonly get: {
    method<T>(method: string, until?: t.UntilInput): Promise<T>;
    time(until?: t.UntilInput): Promise<{ current: t.Secs; duration: t.Secs }>;
    currentTime(until?: t.UntilInput): Promise<t.Secs>;
    duration(until?: t.UntilInput): Promise<t.Secs>;
  };
};
