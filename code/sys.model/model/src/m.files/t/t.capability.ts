import type { t } from '../common.ts';
import type { Core } from './t.u.core.ts';

/**
 * Capability facts for bounded Files views.
 */
export declare namespace FilesCapability {
  /** Files capability name. */
  export type Name = 'list' | 'stat' | 'read' | 'write' | 'remove' | 'watch' | 'manifest';
  /** Boolean capability map. */
  export type Map = { readonly [K in Name]: boolean };

  /** Capability facts for a bounded Files view. */
  export type Capabilities = Map & {
    /** Backing/transport fidelity for this view. */
    readonly fidelity?: Core.Fidelity;
    /** Maximum inline read size, when enforced by the backing. */
    readonly maxReadBytes?: t.NumberBytes;
    /** Maximum write payload size, when enforced by the backing. */
    readonly maxWriteBytes?: t.NumberBytes;
    /** Inline encodings supported by this view. */
    readonly encodings?: readonly Core.Encoding[];
  };
}
