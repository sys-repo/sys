import type * as t from '../-spec.t/t.ts';
import { DEFAULTS } from '../common.ts';

export { t };

/** Libs: */
export { DriverDev } from '../-dev.harness/mod.ts';
export { Button, ObjectView } from '../../u.ts';
export * from '../common.ts';

/** Components: */
export { Dist } from '../../Dist/mod.ts';
export { Player } from '../../Player/mod.ts';

/** Constants: */
export const D = {
  ...DEFAULTS,
  DEV: { baseUrl: 'http://localhost:4040/publish.assets' },
};
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
