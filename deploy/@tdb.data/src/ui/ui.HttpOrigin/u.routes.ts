import type { t } from './common.ts';

export const Routes = {
  domain: 'socialleancanvas.com',
  origin: {
    localhost: {
      proxy: 'http://localhost:1234/data/',
      cdn: 'http://localhost:4041/slc-data/',
    },
    production: {
      proxy: 'https://socialleancanvas.com/data/',
    },
  } satisfies t.HttpOrigin.SpecMap,
} as const;
