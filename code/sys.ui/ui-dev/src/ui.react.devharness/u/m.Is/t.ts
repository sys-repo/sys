import type { t } from '../common.ts';
import type { TestIsLib } from '@sys/testing/t';

/**
 * Boolean flag evaluation for the DevHarness.
 */
export type DevIsLib = TestIsLib & {
  /** Determine if the given input is null or undefined. */
  nil(input?: any): boolean;

  /** Determine if the given input is a DevCtx. */
  ctx(input?: any): input is t.DevCtx;
};
