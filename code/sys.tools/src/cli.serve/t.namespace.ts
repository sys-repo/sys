import type { t } from './common.ts';

/**
 * The `@sys/tools/serve` type namespace.
 */
export namespace ServeTool {
  export const ID = 'serve' as const;
  export const NAME = 'system/serve:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

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

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs & { port?: number };
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Known MIME types mapped from known filename extensions. */
  export type MimeType = t.MimeType;
  /** MIME type emitted by the server (`octet-stream` fallback for unknown extensions). */
  export type ServedMimeType = MimeType | 'application/octet-stream';
  export type MimeGroup = t.MimeGroup;

  /**
   * YAML-authored serve location configuration (authoritative).
   */
  export namespace LocationYaml {
    /**
     * Mapping between a remote bundle and its local mount-point.
     */
    export type RemoteBundle = {
      /** Remote dist.json endpoint (source of the bundle). */
      remote: { dist: t.StringUrl };
      /** Local destination for the bundle, relative to location dir. */
      local: { dir: t.StringRelativeDir };
      /** Timestamp of last use. */
      lastUsedAt?: t.UnixTimestamp;
    };

    /**
     * YAML document structure for a serve location.
     */
    export type Doc = {
      /** Display name. */
      name: string;
      /** Directory to serve (relative to CLI cwd, or absolute). */
      dir: t.StringDir;
      /** Optional list of remote bundles that can be pulled. */
      remoteBundles?: RemoteBundle[];
    };

    /**
     * Filesystem conventions for serve location YAML storage.
     */
    export type DirName = `-config/${string}.serve`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
    export type LoadResult =
      | { readonly ok: true; readonly cwd: t.StringDir; readonly location: Location }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };

    /**
     * Runtime location with resolved paths.
     */
    export type Location = {
      /** Display name. */
      readonly name: string;
      /** Resolved absolute directory to serve. */
      readonly dir: t.StringDir;
      /** Optional remote bundles. */
      readonly remoteBundles?: RemoteBundle[];
    };
  }

  /**
   * JSON view outcome for a requestable path.
   */
  export namespace JsonView {
    export type Result = File | Folder;
    export type File = {
      readonly kind: 'file';
      readonly body: {
        mime: t.ServeTool.ServedMimeType;
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
