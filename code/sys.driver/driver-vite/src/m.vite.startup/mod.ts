/**
 * @module
 * Startup authority projection and delivery for the Vite child launch seam.
 */
import type { t } from './common.ts';

const notImplemented = (name: string): never => {
  throw new Error(`ViteStartup.${name} not implemented`);
};

export const ViteStartup: t.ViteStartup.Lib = {
  Projection: {
    async create() {
      return notImplemented('Projection.create');
    },
  },
  Delivery: {
    async create() {
      return notImplemented('Delivery.create');
    },
  },
} as const;
