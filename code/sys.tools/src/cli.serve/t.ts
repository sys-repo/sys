import type { t } from './common.ts';

export type * from './cmd.pull/t.ts';

/**
 * CLI helpers for working with Serve.
 */
export type ServeToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * The `@sys/tools/serve` type namespace.
 */
export namespace ServeTool {
  export type Command =
    | 'modify:add'
    | 'modify:remove'
    | 'serve:start'
    | 'bundle'
    | 'bundle:add-remote'
    | 'bundle:pull-latest'
    | 'exit';

  /** Alternative view formats for rendering a route. */
  export type RouteView = 'json';

  /** Abstract lookup for supported MIME types. */
  export type MimeLookup = { has(mime: t.ServeTool.MimeType): boolean };

  /** Command line arguments (argv). */
  export type CliArgs = t.ToolsCliArgs;

  /** Config File */
  export type Config = t.JsonFile<ServeTool.ConfigDoc>;
  export type ConfigDoc = t.JsonFileDoc & {
    name: string;
    dirs?: ServeTool.DirConfig[];
  };

  export type DirConfig = {
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
    remoteBundles?: DirRemoteBundle[];
  };

  /**
   * Mapping between a remote bundle and its local mount-point.
   */
  export type DirRemoteBundle = {
    /** Remote dist.json endpoint (source of the bundle). */
    remote: { dist: t.StringUrl };
    /** Local destination for the bundle, relative to DirConfig.dir. */
    local: { dir: t.StringRelativeDir };
  };

  /** Allowed MIME types for static asset responses. */
  export type MimeGroup = 'images' | 'videos' | 'documents' | 'code' | 'text';
  export type MimeType = t.MimeType;

  /**
   * JSON view outcome for a requestable path.
   */
  export type JsonViewResult = JsonViewFile | JsonViewFolder;
  export type JsonViewFile = {
    readonly kind: 'file';
    readonly body: {
      mime: t.ServeTool.MimeType;
      path: t.StringPath;
      hash: t.StringHash;
      bytes: t.NumberBytes;
    };
  };
  export type JsonViewFolder = {
    readonly kind: 'folder';
    readonly body: t.DistPkg;
  };
}

export type MimeType =
  // Text / docs:
  | 'text/plain'
  | 'text/html'
  | 'text/css'
  | 'application/json'
  | 'application/pdf'
  | 'application/yaml'

  // JS / WASM:
  | 'application/javascript'
  | 'application/wasm'

  // Images:
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/svg+xml'
  | 'image/x-icon'

  // Video:
  | 'video/webm'
  | 'video/mp4';
