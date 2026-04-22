import type { t } from './common.ts';

/**
 * Vite startup seam.
 */
export declare namespace ViteStartup {
  /** Public startup surface for child startup authority and early handoff. */
  export type Lib = {
    readonly Projection: Projection.Lib;
    readonly Delivery: Delivery.Lib;
  };

  /** Startup authority projected for child launch. */
  export type Authority = {
    readonly dir: t.StringAbsoluteDir;
    readonly imports: Imports;
    readonly scopes?: Scopes;
  };

  /** Child-consumable startup handle. */
  export type Handle = {
    readonly path: t.StringPath;
    readonly cleanup: Cleanup;
  };

  export type Imports = Readonly<Record<string, string>>;
  export type Scopes = Readonly<Record<string, Imports>>;
  export type Cleanup = () => Promise<void>;

  /** Startup authority projection. */
  export namespace Projection {
    export type Lib = {
      /** Project startup authority for child launch. */
      readonly create: (args: Args) => Promise<Authority>;
    };

    export type Args = {
      readonly cwd: t.StringAbsoluteDir;
      readonly vite: string;
    };
  }

  /** Startup authority delivery. */
  export namespace Delivery {
    export type Lib = {
      /** Deliver startup authority as a child handle. */
      readonly create: (args: Args) => Promise<Handle>;
    };

    export type Args = {
      readonly authority: Authority;
    };
  }
}
