import type { t } from './common.ts';
import type { Runtime } from '../m.files/t/t.u.runtime.ts';
import type { Error as TError } from '../m.files/t/t.u.error.ts';
import type { Live as TLive } from '../m.files/t/t.u.live.ts';
import type { FilesFsCapability } from './t.capability.ts';

/**
 * Filesystem-shaped backing adapters for the Files model.
 *
 * Current scope: the Readonly namespace owns readonly Files truth and optional watch hints.
 * A Writable namespace is introduced only with durable write/remove support; no inert
 * writable stubs or root aliases are exposed before backing authority exists.
 */
export declare namespace FilesFs {
  /** Runtime library surface. */
  export type Lib = {
    /** Readonly filesystem-shaped Files backing constructors. */
    readonly Readonly: ReadonlyLib;
  };

  /** Readonly filesystem-shaped Files backing constructors. */
  export type ReadonlyLib = {
    /** Create a bounded readonly Files backing from a structural filesystem capability. */
    readonly create: (options: ReadonlyOptions) => Readonly;

    /** Create a bounded live readonly+watch Files backing from a filesystem watch capability. */
    readonly live: (options: LiveOptions) => Live;
  };

  /** Bounded readonly Files backing. */
  export type Readonly = Runtime.Shape<'files/fs:readonly'>;

  /** Bounded live readonly+watch Files backing. Write/remove remain unsupported. */
  export type Live = TLive.Shape<'files/fs:live'>;

  /** Options for creating a readonly Files backing. */
  export type ReadonlyOptions = Options<Capability.Readonly>;

  /** Options for creating a live readonly+watch Files backing. */
  export type LiveOptions = Options<Capability.Live>;

  /** Structural host-filesystem capabilities consumed by this adapter. */
  export namespace Capability {
    export type Readonly = FilesFsCapability.Readonly;
    export type Live = FilesFsCapability.Live;
    export type Watch = FilesFsCapability.Watch;
    export type WatchOptions = FilesFsCapability.WatchOptions;
    export type Watcher = FilesFsCapability.Watcher;
    export type WatchObservable = FilesFsCapability.WatchObservable;
    export type WatchSubscription = FilesFsCapability.WatchSubscription;
    export type WatchEvent = FilesFsCapability.WatchEvent;
    export type WatchEventKind = FilesFsCapability.WatchEventKind;
    export type Path = FilesFsCapability.Path;
    export type PathIs = FilesFsCapability.PathIs;
    export type Stat = FilesFsCapability.Stat;
    export type WalkEntry = FilesFsCapability.WalkEntry;
  }

  type Options<Fs extends Capability.Readonly> =
    & Runtime.Options
    & Runtime.InlineReadOptions
    & {
      /** Structural filesystem capability. */
      readonly fs: Fs;

      /** Host/backing root. Never exposed through Files results. */
      readonly root: t.StringPath;
    };

  /** Files/fs error surface. */
  export namespace Error {
    export type Kind = `FilesFsError.${TError.KindSuffix}`;
  }
}
