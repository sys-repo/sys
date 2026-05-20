import type { t } from '../common.ts';
import type { FilesBase } from './t.base.ts';

/**
 * Capability facts for bounded Files views.
 */
export declare namespace FilesCapability {
  /** Read-oriented capability name for a bounded Files view. */
  export type Capability = Name;

  export type Name = 'list' | 'stat' | 'read' | 'watch' | 'manifest';
  export type Map = { readonly [K in Name]: boolean };

  /** Capability facts for a bounded Files view. */
  export type Capabilities = Map & {
    /** Backing/transport fidelity for this view. */
    readonly fidelity?: FilesBase.Fidelity;

    /** Maximum inline read size, when enforced by the backing. */
    readonly maxReadBytes?: t.NumberBytes;

    /** Inline encodings supported by this view. */
    readonly encodings?: readonly FilesBase.Encoding[];
  };
}
