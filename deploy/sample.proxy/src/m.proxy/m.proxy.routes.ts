import type { HttpProxy } from '@sys/http/t';

export type Routes = {
  readonly baseUrl: string;
  readonly proxy: HttpProxy.Config;
};

export const Routes: Routes = {
  baseUrl: 'https://socialleancanvas.com/',
  proxy: {
    root: { upstream: 'https://site.socialleancanvas.com/' },
    mounts: [{ mountPath: '/slc/', upstream: 'https://slc.db.team/slc/' }],
  },
};
