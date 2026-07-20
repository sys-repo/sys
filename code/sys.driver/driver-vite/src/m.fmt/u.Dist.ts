import { c, Cli, Num, Path, Pkg, Str, type t, Time } from './common.ts';
import {
  clipLine,
  clipValue,
  digestSuffixes,
  hashValue,
  metadataPrefix,
  metadataRow,
  outputWidth,
} from './u.ts';

const LABEL_WIDTH = 22;

export const Dist: t.ViteLog.Dist.Lib = {
  log(dist, options = {}) {
    console.info(Dist.toString(dist, options));
  },

  toString(dist, options = {}) {
    if (!dist) return c.yellow(`dist: nothing to display`);

    const width = outputWidth(options.width);
    const outDir = options.dirs?.out ?? './dist';
    const builder = Pkg.toPkg(dist.build.builder);
    const subject = dist.pkg ?? builder;
    const hash = dist.hash.digest;
    const title = c.green(options.title ?? 'Production Bundle');
    const distPath = wrangle.distPath(outDir);
    const lines = [
      title ? clipLine(title, width) : '',
      wrangle.moduleLine(subject, hash.slice(-5), width),
      clipLine(c.gray('↓'), width),
      wrangle.row('size:', c.white(Str.bytes(dist.build.size.total)), width),
      wrangle.row('size:/pkg/*', wrangle.pkgSize(dist), width),
      metadataRow({
        label: 'dist:',
        value: distPath,
        width,
        labelWidth: LABEL_WIDTH,
        suffixes: digestSuffixes(hash),
      }),
      wrangle.hashRow(hash, width),
      wrangle.row('timestamp:', wrangle.timestampCandidates(dist.build.time), width),
      wrangle.row('builder:', wrangle.moduleCandidates(builder), width),
    ];

    return lines.filter(Boolean).join('\n').trimEnd();
  },
};

/**
 * Helpers:
 */
const wrangle = {
  distPath(outDir: string) {
    const text = `${Path.trimCwd(Path.join(outDir, 'dist.json'))}`.replace(/^(?:\.\/)+/, '');
    const index = text.lastIndexOf('/');
    if (index < 0) return c.green(text);
    return `${c.gray(text.slice(0, index + 1))}${c.green(text.slice(index + 1))}`;
  },

  row(label: string, value: string | readonly string[], width: number) {
    const prefix = metadataPrefix({ label, labelWidth: LABEL_WIDTH });
    const values = Array.isArray(value) ? value : [value];
    const match = values.find((candidate) => {
      return Cli.Fmt.Text.visibleWidth(`${prefix}${candidate}`) <= width;
    });
    if (match) return clipLine(`${prefix}${match}`.trimEnd(), width);

    const valueWidth = Cli.Fmt.Text.fitWidth({
      width,
      reserve: Cli.Fmt.Text.visibleWidth(prefix),
      terminal: false,
    });
    return clipLine(`${prefix}${clipValue(values.at(-1) ?? '', valueWidth)}`.trimEnd(), width);
  },

  pkgSize(dist: t.DistPkg) {
    const total = dist.build.size.total;
    const pkg = dist.build.size.pkg;
    const percent = total === 0 ? 0 : Num.toString((pkg / total) * 100, 0);
    return c.gray(`${Str.bytes(pkg)} ${c.dim(`(${c.gray(`↑ ${percent}%`)})`)}`);
  },

  hashRow(hash: t.StringHash, width: number) {
    const prefix = metadataPrefix({ label: '', labelWidth: LABEL_WIDTH });
    const valueWidth = Cli.Fmt.Text.fitWidth({
      width,
      reserve: Cli.Fmt.Text.visibleWidth(prefix),
      terminal: false,
    });
    return clipLine(`${prefix}${hashValue(hash, valueWidth)}`.trimEnd(), width);
  },

  timestampCandidates(timestamp: t.UnixTimestamp) {
    const full = Time.Date.format(timestamp, 'd MMM y, h:mmaaa');
    const medium = Time.Date.format(timestamp, 'd MMM, h:mmaaa');
    const short = Time.Date.format(timestamp, 'h:mmaaa');
    const ago = `${Time.elapsed(timestamp)} ago`;
    return [
      c.gray(`${full} • ${ago}`),
      c.gray(`${medium} • ${ago}`),
      c.gray(`${short} • ${ago}`),
      c.gray(ago),
    ];
  },

  moduleLine(pkg: t.Pkg, hash: string, width: number) {
    const candidates = wrangle.moduleCandidates(pkg, hash);
    const match = candidates.find((candidate) => Cli.Fmt.Text.visibleWidth(candidate) <= width);
    return clipLine(c.bold(match ?? c.gray(clipValue(wrangle.unscoped(pkg.name), width))), width);
  },

  moduleCandidates(pkg: t.Pkg, hash?: string) {
    const name = pkg.name.trim() || 'unknown';
    const version = pkg.version.trim();
    const unscoped = wrangle.unscoped(name);
    const nameVersion = wrangle.module(name, version);
    const unscopedVersion = wrangle.module(unscoped, version);
    return [
      hash ? `${nameVersion}${c.dim(`.#${hash}`)}` : '',
      nameVersion,
      unscopedVersion,
      c.gray(c.white(name)),
      c.gray(c.white(unscoped)),
    ].filter(Boolean);
  },

  module(name: string, version: string) {
    return c.gray(`${c.white(name)}@${c.cyan(version)}`);
  },

  unscoped(name: string) {
    const index = name.lastIndexOf('/');
    return index >= 0 ? name.slice(index + 1) || name : name;
  },
} as const;
