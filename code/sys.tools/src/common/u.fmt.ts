import { pkg } from '../pkg.ts';
import { c, Cli, Pkg, Str } from './libs.ts';
import * as t from './t.ts';

type HelpInput =
  | Omit<t.CliFormatHelpInputSections, 'tool'>
  | Omit<t.CliFormatHelpInputShorthand, 'tool'>;

export const Fmt = {
  Tree: Cli.Fmt.Tree,

  /**
   * Deterministic runnable command for this published package.
   */
  invoke(...parts: string[]) {
    return ['deno run -A jsr:@sys/tools', ...parts].join(' ').trim();
  },

  /**
   * Common intro header.
   */
  async header(toolname: string, dir?: t.StringDir, opts: { exitHint?: boolean } = {}) {
    const { exitHint = true } = opts;
    let identity = c.gray(`${c.green(toolname)} v${pkg.version}`);
    if (exitHint) identity += c.gray(c.dim(` (Ctrl-C to exit)`));
    return identity;
  },

  /**
   * Common signoff.
   */
  signoff(toolname: string) {
    const self = `${Pkg.toString(pkg)}:${toolname}`;
    return Str.builder()
      .line(c.dim(c.gray(self)))
      .toString();
  },

  helpInput(
    toolname: string,
    input: HelpInput = {},
  ): t.CliFormatHelpInput {
    if ('sections' in input && input.sections) {
      return {
        tool: toolname,
        summary: `${pkg.name} v${pkg.version}`,
        note: input.note,
        sections: input.sections,
      };
    }

    return {
      tool: toolname,
      summary: `${pkg.name} v${pkg.version}`,
      note: input.note,
      usage: input.usage,
      options: input.options,
      examples: input.examples,
    };
  },

  /**
   * Common help.
   */
  async help(toolname: string, input: HelpInput = {}) {
    return Cli.Fmt.Help.build(Fmt.helpInput(toolname, input));
  },

  /**
   * Common prerequisites:
   */
  Prereqs: {
    folderNotConfigured(cwd: t.StringDir, toolname: string) {
      const str = Str.builder()
        .line()
        .line(c.yellow(c.italic(`  Folder is not yet configured for ${c.white(toolname)}.`)))
        .line();
      return String(str);
    },
  },

  /**
   * Generic number formatter with optional warning color.
   */
  number(value: number, warnAt?: number, fmt?: (n: number) => string): string {
    const s = fmt ? fmt(value) : value.toLocaleString();
    if (warnAt === undefined) return s;
    return value > warnAt ? c.yellow(s) : s;
  },

  /**
   * Formats bytes using `Str.bytes` and optional warning color.
   */
  bytes(bytes: t.NumberBytes, warnAt?: t.NumberBytes): string {
    return Fmt.number(bytes, warnAt, Str.bytes);
  },

  /**
   * Common format for text in a waiting spinner.
   */
  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  /**
   * Common compact hash suffix display.
   * eg. "#abcde" with dim/gray "#" and green suffix.
   */
  hashSuffix(hash: string, suffix = 5) {
    const tail = String(hash).slice(-Math.max(0, suffix));
    return `${c.dim(c.gray('#'))}${c.green(tail)}`;
  },

  prettyPath(path: t.StringPath, highlightLevels = 1) {
    const parts = path.split('/');
    const start = parts.slice(0, -highlightLevels);
    const end = parts.slice(-highlightLevels);
    return c.gray(`${start.join('/')}/${c.cyan(end.join('/'))}`);
  },
} as const;
