import type { t } from './common.ts';
import { create, storageUrl } from './m.create.ts';

/**
 * R2 service constructor surface.
 */
export const Service: t.R2.Service.Lib = {
  create,
  storageUrl,
};
