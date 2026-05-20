import type { t } from '../common.ts';
import type { FilesCapability } from './t.capability.ts';
import type { FilesContentRef } from './t.content-ref.ts';
import type { FilesCursor } from './t.cursor.ts';
import type { FilesEntry } from './t.entry.ts';

/**
 * Portable manifest for a bounded Files view.
 */
export declare namespace FilesManifest {
  /** Portable manifest for a bounded Files view. */
  export type Manifest = {
    /** Manifest model version. */
    readonly version: 'sys.files.manifest.v1';

    /** Capability facts for this view. */
    readonly capabilities: FilesCapability.Capabilities;

    /** Visible entries. */
    readonly entries: readonly FilesEntry.Entry[];

    /** Content refs available for entries, when this is a snapshot/static view. */
    readonly content?: readonly FilesContentRef.ContentRef[];

    /** Snapshot/build timestamp, when known. */
    readonly generated?: t.StringIsoDate;

    /** Cursor for additional manifest pages, when paged. */
    readonly cursor?: FilesCursor.Manifest;

    /** True when the manifest is intentionally partial. */
    readonly truncated?: boolean;
  };
}
