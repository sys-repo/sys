import type { t } from './common.ts';

export declare namespace ReverseProxy {
  export type App = t.HonoApp;
  export type Lib = {
    create(options?: StartOptions): App;
    start(options?: StartOptions): Promise<void>;
  };

  export type Target = {
    pattern: string;
    upstream: t.StringUrl;
    stripPrefix?: string;
  };

  export type StartOptions = {
    port?: number;
    targets?: Target[];
  };
}
