export * from '../common.ts';
export { toHeaders } from '../m.Http/u.ts';

export const DEFAULTS = {
  contentType: 'application/json',
  error: {
    checksumFail: {
      status: 412,
      statusText: 'Pre-condition failed (checksum-mismatch)',
    },
    clientDisposed: {
      status: 499,
      statusText: 'Fetch operation disposed before completing',
    },
    unknown: {
      status: 520,
    },
  },
} as const;
