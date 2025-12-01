import type { t } from './common.ts';

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
  export type Command = 'modify:add' | 'modify:remove' | 'serve:start' | 'exit';

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
    name: string; // display name
    dir: t.StringDir;
    contentTypes: MimeType[];
    createdAt: t.UnixTimestamp;
    modifiedAt?: t.UnixTimestamp;
  };

  /** Allowed MIME types for static asset responses. */
  export type MimeGroup = 'images' | 'videos' | 'documents' | 'code' | 'text';
  export type MimeType =
    // Text / docs:
    | 'text/plain'
    | 'text/html'
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
