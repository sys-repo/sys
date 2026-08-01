export * from '../common.ts';
export { toHeaders } from '../m.HttpClient/u.ts';

export const DEFAULTS = {
  contentType: 'application/json',
  error: {
    checksumFail: {
      status: 412,
      statusText: 'Pre-condition failed (checksum-mismatch)',
    },
    cancelled: {
      status: 499,
      statusText: 'Fetch operation cancelled before completing',
    },
    unknown: {
      status: 520,
    },
  },
} as const;
