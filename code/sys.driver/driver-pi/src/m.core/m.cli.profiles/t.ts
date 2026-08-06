import type { t } from './common.ts';

/**
 * Profile YAML contracts for running Pi as a system agent.
 */
export declare namespace PiCliProfiles {
  /** Runtime surface for the profile-driven Pi launcher. */
  export type Lib = {
    /** Parse wrapper args, optionally show help, then launch or open the profile menu. */
    main(input?: Input): Promise<Result>;
    /** Run Pi from a concrete profile config. */
    run(args: RunArgs): Promise<t.Process.InheritOutput>;
    /** Open the profile config menu. */
    menu(args: MenuArgs): Promise<MenuResult>;
  };

  /** Profile boundary entry input. */
  export type Input = {
    /** Boundary argv; args after `--` pass through to Pi. */
    readonly argv?: readonly string[];
    /** Terminal working directory used to resolve profile paths. */
    readonly cwd?: t.StringDir | t.PiCli.Cwd;
    /** Environment overrides passed to the Pi process. */
    readonly env?: Record<string, string>;
    /** Unsafe debug escape hatch: launch the Pi child with Deno full permissions. */
    readonly allowAll?: boolean;
    /** Extra read-scope paths added to the Pi sandbox. */
    readonly read?: readonly t.StringPath[];
    /** Extra write-scope paths added to the Pi sandbox. */
    readonly write?: readonly t.StringPath[];
    /** Pi package specifier override, primarily for tests and pinned launchers. */
    readonly pkg?: t.StringModuleSpecifier;
    /** Terminal capability override for embedded/test launches; defaults to process stdio. */
    readonly tty?: Tty;
  };

  /** Terminal capability snapshot used before opening interactive prompts. */
  export type Tty = {
    /** Whether stdin can safely serve an interactive prompt. */
    readonly stdin: boolean;
    /** Whether stdout can safely render an interactive prompt. */
    readonly stdout: boolean;
  };

  /** Concrete run request after startup cwd resolution. */
  export type RunArgs = {
    /** Git-rooted cwd contract already resolved by startup. */
    readonly cwd: t.PiCli.Cwd;
    /** Profile config YAML file. */
    readonly config: t.StringPath;
    /** Extra Pi args appended at invocation time. */
    readonly args?: readonly string[];
    /** Environment overrides merged over profile env. */
    readonly env?: Record<string, string>;
    /** Unsafe debug escape hatch: launch the Pi child with Deno full permissions. */
    readonly allowAll?: boolean;
    /** Extra read-scope paths merged with profile read scope. */
    readonly read?: readonly t.StringPath[];
    /** Extra write-scope paths merged with profile write scope. */
    readonly write?: readonly t.StringPath[];
    /** Pi package specifier override, primarily for tests and pinned launchers. */
    readonly pkg?: t.StringModuleSpecifier;
    /** Launcher-owned optical character recognition (OCR) startup setup options. */
    readonly ocr?: RunArgs.Ocr;
  };

  export namespace RunArgs {
    /** Launcher-owned optical character recognition (OCR) startup setup options. */
    export type Ocr = {
      /** Whether to run OCR preflight; disabled only for OCR-preflight-free previews. */
      readonly preflight?: boolean;
      /** Explicit consent to install missing OCR dependencies. */
      readonly installDeps?: boolean;
      /** Whether startup may ask for interactive OCR install consent. */
      readonly interactive?: boolean;
    };
  }

  /** Menu input. */
  export type MenuArgs = {
    /** Resolved cwd contract used to locate profiles and render sandbox previews. */
    readonly cwd: t.PiCli.Cwd;
    /** Unsafe debug escape hatch applied to sandbox previews from the menu. */
    readonly allowAll?: boolean;
    /** Whether `--git-root` was explicitly supplied at the launcher boundary. */
    readonly gitRootExplicit?: boolean;
  };

  /** Parsed boundary args. */
  export type ParsedArgs = {
    /** Whether profile launcher help was requested. */
    readonly help?: boolean;
    /** Whether the wrapper should launch Pi with full Deno permissions. */
    readonly allowAll?: boolean;
    /** Whether prompts must be disabled and a profile must be supplied. */
    readonly nonInteractive?: boolean;
    /** Explicit consent to install missing OCR dependencies during startup. */
    readonly installOcrDeps?: boolean;
    /** Profile name or config path selected at the CLI boundary. */
    readonly profile?: string;
    /** Runtime-root discovery mode parsed from `--git-root`. */
    readonly gitRoot?: t.PiCli.GitRootMode;
    /** Pi args captured after `--`. */
    readonly _: readonly string[];
  };

  /** Profile launcher result. */
  export type Result = Help | Ran | Ui | Exit;

  /** Selected profile start mode. */
  export type StartMode = 'cli' | 'ui';

  /** Help output result. */
  export type Help = {
    /** Discriminator for help output. */
    readonly kind: 'help';
    /** Original profile launcher input. */
    readonly input: Input;
    /** Rendered help text written to stdout. */
    readonly text: string;
  };

  /** Successful launch result. */
  export type Ran = {
    /** Discriminator for a launched profile run. */
    readonly kind: 'run';
    /** Original profile launcher input. */
    readonly input: Input;
    /** Parsed profile launcher args used for the run. */
    readonly parsed: ParsedArgs;
    /** Inherited child-process output from the Pi invocation. */
    readonly output: t.Process.InheritOutput;
  };

  /** Successful UI launch result. */
  export type Ui = {
    /** Discriminator for a launched local profile UI flow. */
    readonly kind: 'ui';
    /** Original profile launcher input. */
    readonly input: Input;
    /** Parsed profile launcher args used for the launch selection. */
    readonly parsed: ParsedArgs;
  };

  /** User exited the profile menu without launching. */
  export type Exit = {
    /** Discriminator for a user-cancelled profile run. */
    readonly kind: 'exit';
    /** Original profile launcher input. */
    readonly input: Input;
  };

  /** Sandbox evidence produced by the profile menu preview. */
  export type MenuPreview = {
    /** Sandbox snapshot represented by the preview report. */
    readonly sandbox: t.PiCli.SandboxSummary;
    /** Persisted report represented by the preview sheet. */
    readonly report: t.StringPath;
  };

  /** Profile menu result. */
  export type MenuResult =
    | {
      /** Discriminator for a menu exit without launch. */
      readonly kind: 'exit';
    }
    | {
      /** Discriminator for a selected profile config. */
      readonly kind: 'selected';
      /** Selected profile start mode. */
      readonly mode: StartMode;
      /** Selected profile config path. */
      readonly config: t.StringPath;
      /** Current sandbox evidence rendered by the menu flow. */
      readonly preview?: MenuPreview;
    };

  /** Sandbox policy for a Pi profile. */
  export type Sandbox = {
    /** Capabilities granted to Pi. */
    readonly capability?: Sandbox.Capability;
    /** Intentional context made visible to Pi. */
    readonly context?: Sandbox.Context;
  };

  /** Sandbox policy helper types. */
  export namespace Sandbox {
    /** Filesystem and process capabilities granted to Pi. */
    export type Capability = {
      /** Extra readable paths beyond the default launcher scope. */
      readonly read?: readonly t.StringPath[];
      /** Extra writable paths beyond the default launcher scope. */
      readonly write?: readonly t.StringPath[];
      /** Extra environment variables passed to Pi. */
      readonly env?: Record<string, string>;
    };

    /** Guidance and instruction sources intentionally injected into Pi's prompt. */
    export type Context = {
      /** Extra guidance files loaded after standard project-root context. */
      readonly append?: readonly t.StringPath[];
    };
  }

  /** Prompt policy for a Pi profile. */
  export type Prompt = {
    /**
     * System prompt policy.
     *
     * - omitted or `null` selects the wrapper-owned `DEFAULT_SYSTEM_PROMPT`.
     * - `string` passes that explicit replacement to Pi.
     */
    readonly system?: string | null;
  };

  /** Tool policy exposed by a Pi profile. */
  export type Tools = {
    /** Filesystem removal tool policy. */
    readonly remove?: Tools.Remove;
    /** Filesystem move/rename tool policy. */
    readonly move?: Tools.Move;
    /** Filesystem copy/import tool policy. */
    readonly copy?: Tools.Copy;
    /** Optical character recognition (OCR) tool policy. */
    readonly ocr?: Tools.Ocr;
  };

  /** Tool policy helper types. */
  export namespace Tools {
    /** Filesystem removal tool policy. */
    export type Remove = {
      /** Enable the wrapper-owned `remove` tool. */
      readonly enabled?: boolean;
      /** Allow recursive directory tree removal through `remove`. */
      readonly recursive?: boolean;
    };

    /** Filesystem move/rename tool policy. */
    export type Move = {
      /** Enable the wrapper-owned `move` tool. */
      readonly enabled?: boolean;
    };

    /** Filesystem copy/import tool policy. */
    export type Copy = {
      /** Enable the wrapper-owned `copy` tool. */
      readonly enabled?: boolean;
    };

    /** Optical character recognition (OCR) tool policy. */
    export type Ocr = {
      /** PDF OCR tool policy. */
      readonly pdf?: OcrPdf;
    };

    /** PDF optical character recognition (OCR) tool policy. */
    export type OcrPdf = {
      /** Enable the wrapper-owned `ocr_pdf` tool. */
      readonly enabled?: boolean;
      /** Allowed OCR language codes. */
      readonly languages?: readonly string[];
      /** Language used when a tool call omits `language`. */
      readonly defaultLanguage?: string;
      /** Fixed render DPI for this profile, bounded to 72..600. */
      readonly dpi?: number;
      /** Maximum pages processed by one tool call, bounded to 1..100. */
      readonly maxPages?: number;
      /** Maximum emitted OCR characters, bounded to 1..1,000,000. */
      readonly maxChars?: number;
      /** Total command budget for one tool call, bounded to 1,000..600,000ms. */
      readonly timeoutMs?: number;
    };
  }

  /** Persisted YAML document types. */
  export namespace Yaml {
    /** Canonical config directory shape. */
    export type DirName = `-config/${string}`;
    /** Profile config file extension. */
    export type Ext = '.yaml';

    /** YAML document persisted per profile config file. */
    export type Profile = {
      /** Optional prompt override policy for this profile. */
      readonly prompt?: PiCliProfiles.Prompt;
      /** Explicit sandbox policy for this profile. */
      readonly sandbox?: PiCliProfiles.Sandbox;
      /** Explicit tool policy for this profile. */
      readonly tools?: PiCliProfiles.Tools;
    };

    /** YAML validation result. */
    export type YamlCheck =
      | {
        /** Whether validation succeeded. */
        readonly ok: true;
        /** Parsed profile document. */
        readonly doc: Profile;
      }
      | {
        /** Whether validation failed. */
        readonly ok: false;
        /** Schema or parse errors reported by validation. */
        readonly errors: readonly unknown[];
      };
  }
}
