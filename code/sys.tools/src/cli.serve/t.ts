import type { t } from './common.ts';

/**
 * The `@sys/tools/serve` type namespace.
 */
export namespace ServeTool {
  export type Command = 'modify:add' | 'modify:remove' | 'serve:start' | 'exit';
}

/** Alternative view formats for rendering a route. */
export type ServeRouteView = 'json';

/** Abstract lookup for supported MIME types. */
export type ServeMimeLookup = { has(mime: t.MimeType): boolean };

/**
 * CLI helpers for working with Serve.
 */
export type ServeToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type ServeCliArgs = t.ToolsCliArgs;

/**
 * Config File
 */
export type ServeConfig = t.JsonFile<ServeConfigDoc>;
export type ServeConfigDoc = t.JsonFileDoc & {
  name: string;
  dirs?: ServeDirConfig[];
};

export type ServeDirConfig = {
  name: string; // Display name
  dir: t.StringDir;
  contentTypes: MimeType[];
  createdAt: t.UnixTimestamp;
  modifiedAt?: t.UnixTimestamp;
};

/**
 * Allowed MIME types for static asset responses.
 */
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
export type ServeJsonViewResult = ServeJsonViewFile | ServeJsonViewFolder;
export type ServeJsonViewFile = {
  readonly kind: 'file';
  readonly body: {
    mime: t.MimeType;
    path: t.StringPath;
    hash: t.StringHash;
    bytes: t.NumberBytes;
  };
};
export type ServeJsonViewFolder = {
  readonly kind: 'folder';
  readonly body: t.DistPkg;
};
