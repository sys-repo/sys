import type { t } from './common.ts';

/**
 * The `@sys/tools/serve` type namespace.
 */
export namespace ServeTool {
  export type Id = 'serve';
  export type Name = 'system/serve:tools';

  /** Command names. */
  export type Command =
    | 'dir:add'
    | 'dir:remove'
    | 'serve:start/local'
    | 'serve:start/network'
    | 'bundle'
    | 'bundle:add-remote'
    | 'bundle:pull-latest'
    | 'bundle:open'
    | 'back'
    | 'exit';
  export type MenuOption = { name: string; value: Command };

  /** Alternative view formats for rendering a route. */
  export type RouteView = 'json';

  /** Abstract lookup for supported MIME types. */
  export type MimeLookup = { has(mime: t.ServeTool.MimeType): boolean };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs & { port?: number };
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Configuration file. */
  export namespace Config {
    export type File = t.JsonFile<Doc>;
    export type Doc = t.JsonFileDoc & {
      name: string;
      dirs?: Dir[];
    };

    export type Dir = {
      /** Display name */
      name: string;
      /** The path location of the serve directory. */
      dir: t.StringDir;
      /** Supported mime-types */
      contentTypes: MimeType[];
      /** Timestamps */
      createdAt: t.UnixTimestamp;
      modifiedAt?: t.UnixTimestamp;
      lastUsedAt?: t.UnixTimestamp;

      /** Optional list of remote bundles that can be pulled into this directory. */
      remoteBundles?: RemoteBundleDir[];
    };

    /**
     * Mapping between a remote bundle and its local mount-point.
     */
    export type RemoteBundleDir = {
      /** Remote dist.json endpoint (source of the bundle). */
      remote: { dist: t.StringUrl };
      /** Local destination for the bundle, relative to DirConfig.dir. */
      local: { dir: t.StringRelativeDir };
      /** Timestamps */
      lastUsedAt?: t.UnixTimestamp;
    };
  }

  /** Allowed MIME types for static asset responses. */
  export type MimeType = t.MimeType;
  export type MimeGroup = t.MimeGroup;

  /**
   * JSON view outcome for a requestable path.
   */
  export namespace JsonView {
    export type Result = File | Folder;
    export type File = {
      readonly kind: 'file';
      readonly body: {
        mime: t.ServeTool.MimeType;
        path: t.StringPath;
        hash: t.StringHash;
        bytes: t.NumberBytes;
      };
    };
    export type Folder = {
      readonly kind: 'folder';
      readonly body: {
        dir: t.StringName;
        files: t.StringName[];
        about: { pkg: t.Pkg; cmd: 'serve' };
      };
    };
  }
}
