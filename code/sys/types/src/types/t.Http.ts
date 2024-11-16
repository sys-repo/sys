import type { t } from './common.ts';

/**
 * Resposne from an HTTP fetch request.
 */
export type FetchResponse<T> = {
  ok: boolean;
  status: number;
  url: t.StringUrl;
  data?: T;
  error?: t.StdError;
};
