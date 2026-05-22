import type { t } from './common.ts';
import type { Files as TFilesModel } from '../m.files/t.ts';
import type { Runtime } from '../m.files/t/t.u.runtime.ts';
import type { Error as TError } from '../m.files/t/t.u.error.ts';
import type { Live as TLive } from '../m.files/t/t.u.live.ts';
import type { FilesFsCapability } from './t.capability.ts';

/**
 * Filesystem-shaped backing adapters for the Files model.
 *
 * Authority namespaces declare readonly vs writable construction at the call site.
 * Liveness remains a constructor inside the selected authority namespace.
 */
export declare namespace FilesFs {
  /** Files model runtime surface with filesystem backing adapters attached at `Files.Fs`. */
  export type FilesLib = TFilesModel.Lib & {
    /** Filesystem-shaped backing adapters. */
    readonly Fs: Lib;
  };

  /** Filesystem backing adapter surface. */
  export type Lib = {
    /** Readonly filesystem-shaped Files backing constructors. */
    readonly Readonly: ReadonlyLib;

    /** Writable filesystem-shaped Files backing constructors. */
    readonly Writable: WritableLib;
  };

  /** Readonly filesystem-shaped Files backing constructors. */
  export type ReadonlyLib = {
    /** Create a bounded readonly Files backing from a structural filesystem capability. */
    readonly create: (options: ReadonlyOptions) => Readonly;

    /** Create a bounded live readonly+watch Files backing from a filesystem watch capability. */
    readonly live: (options: LiveOptions) => Live;
  };

  /** Writable filesystem-shaped Files backing constructors. */
  export type WritableLib = {
    /** Create a bounded writable Files backing from a structural filesystem capability. */
    readonly create: (options: WritableOptions) => Writable;

    /** Create a bounded writable+watch Files backing from a filesystem watch capability. */
    readonly live: (options: WritableLiveOptions) => WritableLive;
  };

  /** Bounded readonly Files backing. */
  export type Readonly = Runtime.Shape<'files/fs:readonly'>;

  /** Bounded writable Files backing. */
  export type Writable = Runtime.Shape<'files/fs:writable'>;

  /** Bounded live readonly+watch Files backing. Write/remove remain unsupported. */
  export type Live = TLive.Shape<'files/fs:live'>;

  /** Bounded live writable+watch Files backing. */
  export type WritableLive = TLive.Shape<'files/fs:writable-live'>;

  /** Options for creating a readonly Files backing. */
  export type ReadonlyOptions = Options<Capability.Readonly>;

  /** Options for creating a live readonly+watch Files backing. */
  export type LiveOptions = Options<Capability.Live>;

  /** Options for creating a writable Files backing. */
  export type WritableOptions = WritableOptionsBase<Capability.Writable>;

  /** Options for creating a live writable+watch Files backing. */
  export type WritableLiveOptions = WritableOptionsBase<Capability.LiveWritable>;

  /** Structural host-filesystem capabilities consumed by this adapter. */
  export namespace Capability {
    export type Readonly = FilesFsCapability.Readonly;
    export type Writable = FilesFsCapability.Writable;
    export type Live = FilesFsCapability.Live;
    export type LiveWritable = FilesFsCapability.LiveWritable;
    export type WriteFileOptions = FilesFsCapability.WriteFileOptions;
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

  type WritableOptionsBase<Fs extends Capability.Writable> =
    & Options<Fs>
    & Runtime.InlineWriteOptions;

  /** Files/fs error surface. */
  export namespace Error {
    export type Kind = `FilesFsError.${TError.KindSuffix}`;
  }
}
