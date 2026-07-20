import { c, Cli, Path, Semver, Str, type t } from './common.ts';
import { clipLine, clipText, digest, elapsed, outputWidth, pad, reserveWidth } from './u.ts';

export const Bundle: t.ViteLog.Bundle.Lib = {
  log(args) {
    console.info(Bundle.toString(args));
  },

  toString(args) {
    const { ok, dirs, pkg, hash } = args;
    const width = wrangle.width(args.width);
    const size = Str.bytes(args.totalSize);
    const titleColor = ok ? c.brightGreen : c.brightYellow;
    const input = Path.trimCwd(dirs.in) || './';
    const outDir = Path.trimCwd(dirs.out);
    const fmtElapsed = elapsed(args.elapsed);
    const tx = digest(hash);
    const lines = [
      wrangle.clip(
        `${titleColor(c.bold('Bundle'))}    ${titleColor(size)} ${c.gray(`(${fmtElapsed})`)}`,
        width,
      ),
      wrangle.row('pkg:', pkg ? wrangle.pkg(pkg, args.pkgSize, width) : '', width),
      wrangle.row('in:', clean(input), width),
      wrangle.row('out:', `${clean(outDir)}/dist.json ${tx}`.trim(), width),
    ];

    if (hash) lines.push(wrangle.row('', wrangle.hash(hash, wrangle.valueWidth(width)), width));

    return pad(lines.join('\n').trim(), args.pad);
  },
};

/**
 * Helpers:
 */
const wrangle = {
  width: outputWidth,

  row(label: string, value: string, width: number) {
    const prefix = c.gray(label.padEnd(10, ' '));
    const text = `${prefix}${wrangle.clip(value, wrangle.valueWidth(width))}`.trimEnd();
    return clipLine(text, width);
  },

  valueWidth(width: number) {
    return reserveWidth(width, 10);
  },

  pkg(pkg: t.Pkg, pkgSize: t.NumberBytes | undefined, width: number) {
    const valueWidth = wrangle.valueWidth(width);
    const pkgBytes = pkgSize ? ` /pkg:${c.white(Str.bytes(pkgSize))}` : '';
    const version = Semver.Fmt.colorize(pkg.version);
    const name = c.white(c.bold(pkg.name));
    const module = `${name}${c.dim('@')}${version}`;
    const nameOnly = c.white(c.bold(pkg.name));
    const unscoped = wrangle.unscoped(pkg.name);
    const candidates = [
      `${module}${pkgBytes}`,
      module,
      nameOnly,
      c.white(c.bold(unscoped)),
    ];
    const match = candidates.find((candidate) =>
      Cli.Fmt.Text.visibleWidth(candidate) <= valueWidth
    );
    return match ?? c.white(c.bold(wrangle.clipText(unscoped, valueWidth)));
  },

  unscoped(name: string) {
    const index = name.lastIndexOf('/');
    const value = index >= 0 ? name.slice(index + 1) : name;
    return value || name || 'unknown';
  },

  hash(hash: string, width: number) {
    const text = wrangle.clipText(hash, width);
    if (!text) return '';
    return `${c.dim(c.gray(text.slice(0, -5)))}${c.gray(text.slice(-5))}`;
  },

  clip(input: string, width: number) {
    if (width <= 0) return '';
    if (Cli.Fmt.Text.visibleWidth(input) <= width) return input;
    return clipLine(input, width);
  },

  clipText,
};

function clean(input: t.StringPath = '') {
  return input
    .trim()
    .replace(/^(?:\.\/)+/, '') // ← strip any leading "./" segments.
    .replace(/\/+$/, ''); //      ← strip any trailing "/" characters.
}
