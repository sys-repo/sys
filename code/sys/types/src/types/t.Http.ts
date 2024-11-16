import type { t } from './common.ts';

/**
 * Resposne from an HTTP fetch request.
 */
export type FetchResponse<T> = {
  status: number;
  url: t.StringUrl;
  data?: T;
  error?: t.StdError;
};
