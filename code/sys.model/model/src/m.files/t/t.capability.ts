import type { t } from '../common.ts';
import type { FilesCore } from './t.core.ts';

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
    readonly fidelity?: FilesCore.Fidelity;

    /** Maximum inline read size, when enforced by the backing. */
    readonly maxReadBytes?: t.NumberBytes;

    /** Inline encodings supported by this view. */
    readonly encodings?: readonly FilesCore.Encoding[];
  };
}
