/**
 * @module
 * Filesystem-backed Files model type surface.
 */
import type { t } from './common.ts';
import type { Files as TFiles } from '../m.files/t.ts';
import type * as TCapability from './t/t.capability.ts';

/**
 * Filesystem-shaped backing adapters for the Files model.
 *
 * Authority namespaces declare readonly vs writable construction at the call site.
 * Liveness remains a constructor inside the selected authority namespace.
 */
export declare namespace FilesFs {
  /** Files model runtime surface with filesystem backing adapters attached at `Files.Fs`. */
  export type FilesLib = TFiles.Lib & {
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
  export type Readonly = TFiles.Backing.Shape<'files/fs:readonly'>;

  /** Bounded writable Files backing. */
  export type Writable = TFiles.Backing.Shape<'files/fs:writable'>;

  /** Bounded live readonly+watch Files backing. Write/remove remain unsupported. */
  export type Live = TFiles.Live.Shape<'files/fs:live'>;

  /** Bounded live writable+watch Files backing. */
  export type WritableLive = TFiles.Live.Shape<'files/fs:writable-live'>;

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
    export type Readonly = TCapability.Readonly;
    export type Writable = TCapability.Writable;
    export type Live = TCapability.Live;
    export type LiveWritable = TCapability.LiveWritable;
    export type Watch = TCapability.Watch;
    export type WatchOptions = TCapability.WatchOptions;
    export type Watcher = TCapability.Watcher;
    export type WatchObservable = TCapability.WatchObservable;
    export type WatchSubscription = TCapability.WatchSubscription;
    export type WatchEvent = TCapability.WatchEvent;
    export type WatchEventKind = TCapability.WatchEventKind;
  }

  type Options<Fs extends Capability.Readonly> =
    & TFiles.Backing.Options
    & TFiles.Backing.InlineReadOptions
    & {
      /** Structural filesystem capability. */
      readonly fs: Fs;

      /** Host/backing root. Never exposed through Files results. */
      readonly root: t.StringPath;
    };

  type WritableOptionsBase<Fs extends Capability.Writable> =
    & Options<Fs>
    & TFiles.Backing.InlineWriteOptions;

  /** Files/fs error surface. */
  export namespace Error {
    export type Kind = `FilesFsError.${TFiles.Backing.ErrorKindSuffix}`;
  }
}
