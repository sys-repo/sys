import type { t } from './common.ts';

export const Routes = {
  domain: 'socialleancanvas.com',
  origin: {
    localhost: {
      proxy: 'http://localhost:8080/data/',
      cdn: 'http://localhost:4040/slc-data/',
    },
    production: {
      proxy: 'https://socialleancanvas.com/data/',
      cdn: 'https://cdn.socialleancanvas.com/slc-data/',
    },
  } satisfies t.HttpOrigin.SpecMap,
} as const;
