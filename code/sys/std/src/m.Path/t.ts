import type * as StdPath from '@std/path';
import type { t } from './common.ts';
import type { PathBounded } from './t.bounded.ts';

export type * from './t.bounded.ts';

/**
 * String path helper types.
 */
export declare namespace Path {
  /**
   * Tools for working with string paths.
   * (addresses to resources locally or over a network)
   */
  export type Lib = {
    /** Path type verification flags. */
    readonly Is: Is.Lib;

    /** Tools for formatting standard output (strings) within a CLI. */
    readonly Format: Format.Lib;

    /** Helpers for bounded, root-relative, POSIX-visible resource paths. */
    readonly Bounded: PathBounded.Lib;

    /** Granular, platform specific, path joining tools. */
    readonly Join: Join.Lib;

    /** Joins a sequence of paths, then normalizes the resulting path. */
    readonly join: Join.Lib['auto'];

    /** Joins a sequence of globs, then normalizes the resulting glob. */
    readonly joinGlobs: typeof StdPath.joinGlobs;

    /** Resolves path segments into a path. */
    readonly resolve: typeof StdPath.resolve;

    /** Ensure the given path is absolute. */
    readonly absolute: (path: t.StringPath) => string;

    /** Return the relative path based on current working directory. */
    readonly relative: typeof StdPath.relative;

    /**
     * Return a relative POSIX path:
     *   - convert "\" → "/"
     *   - strip any leading slashes
     * NOTE: intentionally does NOT collapse "."/".." segments.
     */
    relativePosix(input: string): string;

    /** Normalize the path, resolving '..' and '.' segments. */
    readonly normalize: typeof StdPath.normalize;

    /** Converts a file URL to a path string. */
    readonly fromFileUrl: typeof StdPath.fromFileUrl;

    /** Converts a path string to a file URL. */
    readonly toFileUrl: typeof StdPath.toFileUrl;

    /** Return the directory path of a path. */
    readonly dirname: typeof StdPath.dirname;

    /** Return the last portion of a path. */
    readonly basename: typeof StdPath.basename;

    /** Return the extension of the path with leading period (".") */
    readonly extname: typeof StdPath.extname;

    /** Create a helper for evaluating file-path extensions. */
    ext(...suffixes: string[]): FileExtension;

    /** Creates a directory path builder. */
    dir(base: t.StringDir, options?: Dir.Options | Join.Platform): Dir.Builder;
  };

  /**
   * Directory path builder types.
   */
  export namespace Dir {
    /** Options passed to the `Path.dir` method. */
    export type Options = { platform?: Join.Platform };

    /** Builds paths from a root dir. */
    export type Builder = {
      dir(path: string): Builder;
      path(...parts: string[]): t.StringPath;
      toString(): t.StringDir;
    };
  }

  /**
   * Path type verification flags.
   */
  export namespace Is {
    /** Path verification flags. */
    export type Lib = {
      /** Determine if the provided path is absolute (not relative). */
      absolute: typeof StdPath.isAbsolute;

      /** Determine if the provided path is relative (not absolute). */
      relative(path: t.StringPath): boolean;

      /** Test whether the given string is a glob. */
      glob: typeof StdPath.isGlob;

      /**
       * Determine whether a candidate path is lexically within a root path.
       * This is a lexical check only (no realpath/symlink/file-system authority).
       * Behavior is platform-dependent (eg, Windows drive/separator semantics).
       * Returns false for non-strings and non-absolute paths.
       */
      within(root: unknown, candidate: unknown): boolean;
    };
  }

  /**
   * Helpers for joining and normalizing paths on multiple platforms.
   */
  export namespace Join {
    /** Helpers for joining and normalizing paths on multiple platforms. */
    export type Lib = {
      /** Joins a sequence of paths and normalizes the result on Posix (forward-slash "/"). */
      readonly posix: Fn;
      /** Joins a sequence of paths and normalizes the result on Windows (backslash separator). */
      readonly windows: Fn;
      /** Detects the OS and joins/normalizes a sequence of paths with the correct divider character. */
      readonly auto: Fn;
      /** Retrieve the appropriate path joiner based on platform. */
      platform(flag?: Platform): Fn;
    };

    /** Flag used to specify the path joiner platform style. */
    export type Platform = 'auto' | 'posix' | 'windows';

    /** A function that joins paths. */
    export type Fn = (...parts: string[]) => t.StringPath;
  }

  /**
   * Tools for formatting standard output strings within a CLI.
   */
  export namespace Format {
    /** Tools for formatting standard output strings within a CLI. */
    export type Lib = {
      /** Path display formatting. */
      string(path: string, fmt?: Formatter): string;
    };

    /**
     * A style agnostic formatter function for converting a string path
     * into a "pretty" display element, eg. formatted to the console with colors.
     */
    export type Formatter = (e: Args) => t.IgnoredResult;

    /** Arguments passed to a path formatter function. */
    export type Args = Part & {
      /**
       * Safely mutate the part to a new value.
       * @example
       * ```ts
       * e.change(c.green(e.text));
       * ```
       */
      change(to: string): void;

      /**
       * Retrieve the current value of the "part"
       * (same as calling the `.text` property).
       */
      toString(): string;
    };

    /**
     * Represents a single "part" of a path as
     * split by the formatter.
     */
    export type Part = {
      readonly index: t.Index;
      readonly kind: 'slash' | 'dirname' | 'basename';
      readonly part: string;
      readonly path: string;
      readonly is: PartIs;
    };

    /**
     * Flags about a single "part" of a formatter path.
     */
    export type PartIs = {
      readonly first: boolean;
      readonly last: boolean;
      readonly slash: boolean;
      readonly dirname: boolean;
      readonly basename: boolean;
    };
  }

  /**
   * Helper for evaluating file-path extensions.
   */
  export type FileExtension = {
    readonly suffixes: readonly string[];
    is(...path: t.StringPath[]): boolean;
  };
}
