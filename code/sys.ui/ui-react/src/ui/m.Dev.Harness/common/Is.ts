import type { t } from '../common.ts';
import { Is as base } from '@sys/testing/spec';

export const Is = {
  ...base,

  nil(input?: any) {
    return input === undefined || input === null;
  },

  ctx(input: any): input is t.DevCtx {
    if (input === null || typeof input !== 'object') return false;
    const obj = input as t.DevCtx;
    return (
      typeof obj['toObject'] === 'function' &&
      typeof obj['run'] === 'function' &&
      typeof obj['state'] === 'function' &&
      typeof obj['subject'] === 'object' &&
      typeof obj['host'] === 'object' &&
      typeof obj['debug'] === 'object'
    );
  },
} as const;
