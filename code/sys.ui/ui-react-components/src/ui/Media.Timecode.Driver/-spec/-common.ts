export * from '../-dev.harness/common.ts';
export { DriverDev } from '../-dev.harness/mod.ts';
export { Button, ObjectView } from '../../u.ts';

import { DEFAULTS } from '../common.ts';

/**
 * Constants
 */
export const D = {
  ...DEFAULTS,
  DEV: { baseUrl: 'http://localhost:4040/publish.assets' },
};
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
