/**
 * @module
 * Startup authority projection and delivery for the Vite child launch seam.
 */
import type { t } from './common.ts';
import { createDelivery } from './u.delivery.ts';
import { createProjection } from './u.projection.ts';

export const ViteStartup: t.ViteStartup.Lib = {
  Projection: {
    create: createProjection,
  },
  Delivery: {
    create: createDelivery,
  },
} as const;
