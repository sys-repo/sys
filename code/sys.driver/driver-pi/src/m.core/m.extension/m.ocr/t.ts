import type { t } from './common.ts';

/**
 * Wrapper-owned optical character recognition (OCR) Pi extension.
 */
export declare namespace PiOcrExtension {
  /** Runtime surface for the optical character recognition (OCR) extension. */
  export type Lib = {
    /** Resolver surface for optical character recognition (OCR) policy and dependencies. */
    readonly Resolve: Resolve.Lib;
    /** Fixed launcher-owned install command for v1 OCR dependencies. */
    installCommand(): Install.Command;
    /** Convert enabled optical character recognition (OCR) policy to Pi prompt args. */
    toPromptArgs(policy: Policy.Resolved): readonly string[];
  };

  /** Optical character recognition (OCR) resolver namespace. */
  export namespace Resolve {
    /** Runtime resolver surface for optical character recognition (OCR). */
    export type Lib = {
      /** Resolve effective optical character recognition (OCR) policy from profile policy. */
      policy(input?: Policy.Input): PiOcrExtension.Policy.Resolved;
      /** Resolve local optical character recognition (OCR) executable dependencies. */
      dependencies(input: Dependencies.Input): Promise<Dependencies.Output>;
    };

    /** Optical character recognition (OCR) policy resolver types. */
    export namespace Policy {
      /** Inputs required to resolve optical character recognition (OCR) policy. */
      export type Input = {
        /** Profile-authored PDF OCR policy. */
        readonly pdf?: t.PiCliProfiles.Tools.OcrPdf;
      };
    }

    /** Optical character recognition (OCR) dependency resolver types. */
    export namespace Dependencies {
      /** Inputs for OCR dependency resolution primitives. */
      export type Input = {
        /** Optional explicit absolute Homebrew executable path. */
        readonly brewPath?: t.StringPath;
        /** Optional PATH text to probe at launcher preflight time. */
        readonly envPath?: string;
        /** Optional direct executable bin dirs. Defaults to standard Homebrew bin roots. */
        readonly standardBinDirs?: readonly t.StringDir[];
        /** Launcher-owned seam for existence checks. */
        readonly exists: Dependency.Exists;
        /** Optional launcher-owned seam for Homebrew `brew --prefix` probes. */
        readonly command?: Command.Runner;
      };

      /** OCR dependency resolution result. */
      export type Output = Ok | Missing;

      /** Successful OCR dependency resolution result. */
      export type Ok = {
        readonly ok: true;
        readonly executables: Dependency.Executables;
        readonly installCommand: Install.Command;
      };

      /** Missing OCR dependency resolution result. */
      export type Missing = {
        readonly ok: false;
        readonly missing: readonly Dependency.Name[];
        readonly found: Partial<Dependency.Executables>;
        readonly installCommand: Install.Command;
        /** Absolute Homebrew executable path when found during dependency resolution. */
        readonly homebrew?: t.StringPath;
        readonly message: string;
      };
    }
  }

  /** Optical character recognition (OCR) policy types. */
  export namespace Policy {
    /** Resolved optical character recognition (OCR) policy. */
    export type Resolved = {
      /** Resolved PDF OCR policy. */
      readonly pdf: Pdf;
    };

    /** Resolved PDF optical character recognition (OCR) policy. */
    export type Pdf = {
      /** Whether the `ocr_pdf` tool is enabled for this launch. */
      readonly enabled: boolean;
      /** Allowed OCR language codes. */
      readonly languages: readonly string[];
      /** Language used when a tool call omits `language`. */
      readonly defaultLanguage: string;
      /** Fixed render DPI for this profile, bounded to 72..600. */
      readonly dpi: number;
      /** Maximum pages processed by one tool call, bounded to 1..100. */
      readonly maxPages: number;
      /** Maximum emitted OCR characters, bounded to 1..1,000,000. */
      readonly maxChars: number;
      /** Total command budget for one tool call, bounded to 1,000..600,000ms. */
      readonly timeoutMs: number;
    };
  }

  /** Optical character recognition (OCR) dependency types. */
  export namespace Dependency {
    /** v1 OCR executable dependency names. */
    export type Name = 'pdfinfo' | 'pdftoppm' | 'tesseract';

    /** Absolute executable paths resolved by launcher-owned OCR preflight. */
    export type Executables = {
      readonly pdfinfo: t.StringPath;
      readonly pdftoppm: t.StringPath;
      readonly tesseract: t.StringPath;
    };

    /** Seam used by launcher preflight for executable existence checks. */
    export type Exists = (path: t.StringPath) => boolean | Promise<boolean>;
  }

  /** Optical character recognition (OCR) install types. */
  export namespace Install {
    /** Fixed launcher-owned install command for v1 OCR dependencies. */
    export type Command = {
      readonly cmd: 'brew';
      readonly args: readonly ['install', 'poppler', 'tesseract'];
      readonly text: 'brew install poppler tesseract';
    };
  }

  /** Optical character recognition (OCR) command probe types. */
  export namespace Command {
    /** Dependency probe command input. */
    export type Input = {
      /** Absolute command path. */
      readonly cmd: t.StringPath;
      /** Argument array; never a shell string. */
      readonly args: readonly string[];
    };

    /** Dependency probe command output. */
    export type Output = {
      readonly code: number;
      readonly stdout: string;
      readonly stderr: string;
    };

    /** Seam used by launcher preflight for command execution. */
    export type Runner = (input: Input) => Promise<Output>;
  }
}
