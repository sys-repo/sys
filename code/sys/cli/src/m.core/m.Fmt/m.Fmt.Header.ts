import { c, Color, Is, Num, Obj, Pkg, stripAnsi, type t } from '../common.ts';
import { Text } from '../m.Fmt.Text/mod.ts';
import { hr } from './m.Fmt.Hr.ts';

const DEFAULT_TITLE = 'Untitled';
const TITLE_SEPARATOR = ' · ';

/**
 * Application identity header formatter.
 */
export const Header: t.CliFormatHeader.Lib = { rows };

/**
 * Helpers:
 */
function rows(options: t.CliFormatHeader.Options): readonly string[] {
  const width = resolveWidth(options.width);
  if (width === 0) return Object.freeze([]);

  const headline = renderHeadline(options, width);
  const output = [headline];
  if (options.hr !== false) output.push(renderHr(options, width));
  return Object.freeze(output);
}

function renderHeadline(options: t.CliFormatHeader.Options, width: number): string {
  const packageInput = resolvePackageInput(options.pkg);
  const packageName = normalizeText(packageInput?.pkg.name);
  const pkgIdentity = packageName && resolvePkgIdentity(packageName, packageInput?.subpath);
  const customTitle = normalizeTitle(options.title);
  const generatedName = packageName || DEFAULT_TITLE;
  const generatedTitle = renderTitle(generatedName, options.tone);
  const titles = customTitle ? [renderCustomTitle(customTitle, options.tone)] : pkgIdentity
    ? [
      renderPkgTitle(pkgIdentity.full, options.tone),
      renderPkgTitle(pkgIdentity.compact, options.tone),
    ]
    : [generatedTitle];
  const detail = normalizeText(options.detail);
  const version = options.version === false
    ? ''
    : normalizeText(options.version ?? packageInput?.pkg.version);
  const rightLanes = renderRightLanes(detail, version, options.tone);

  for (const right of rightLanes) {
    for (const title of titles) {
      const candidate = renderSplit(title, right, width);
      if (candidate !== undefined) return candidate;
    }
  }

  for (const title of titles) {
    if (Text.Width.measure(title) <= width) return title;
  }

  if (customTitle) {
    return renderTitle(Text.ellipsize(stripAnsi(customTitle).trim(), width), options.tone);
  }
  if (pkgIdentity) return ellipsizePkgTitle(pkgIdentity.compact, width, options.tone);
  return renderTitle(Text.ellipsize(generatedName, width), options.tone);
}

function renderRightLanes(
  detail: string,
  version: string,
  tone?: t.AnsiColor.Name,
): readonly string[] {
  const detailText = applyTone(detail, tone);
  const versionText = c.dim(applyTone(version, tone));

  if (detail && version) {
    const separator = c.dim(applyTone(TITLE_SEPARATOR, tone));
    return [`${detailText}${separator}${versionText}`, versionText];
  }
  if (detail) return [detailText];
  if (version) return [versionText];
  return [];
}

function renderSplit(title: string, right: string, width: number): string | undefined {
  const gap = width - Text.Width.measure(title) - Text.Width.measure(right);
  return gap >= 1 ? `${title}${' '.repeat(gap)}${right}` : undefined;
}

function renderTitle(plain: string, tone?: t.AnsiColor.Name): string {
  return c.bold(applyTone(plain, tone));
}

function renderPkgTitle(identity: PkgIdentity, tone?: t.AnsiColor.Name): string {
  return `${renderTitle(identity.root, tone)}${renderPkgSubpath(identity.subpath, tone)}`;
}

function ellipsizePkgTitle(identity: PkgIdentity, width: number, tone?: t.AnsiColor.Name): string {
  return Text.ellipsize(identity.plain, width, {
    render: ({ head, ellipsis, tail }) => {
      const tailStart = identity.plain.length - tail.length;
      return [
        renderPkgFragment(head, 0, identity, tone),
        renderPkgEllipsis(ellipsis, head.length, identity, tone),
        renderPkgFragment(tail, tailStart, identity, tone),
      ].join('');
    },
  });
}

function renderPkgFragment(
  fragment: string,
  start: number,
  identity: PkgIdentity,
  tone?: t.AnsiColor.Name,
): string {
  if (!fragment) return '';

  const subpathStart = identity.root.length;
  const end = start + fragment.length;
  if (!identity.subpath || end <= subpathStart) return renderTitle(fragment, tone);
  if (start >= subpathStart) return renderPkgSubpath(fragment, tone);

  const rootLength = subpathStart - start;
  return `${renderTitle(fragment.slice(0, rootLength), tone)}${
    renderPkgSubpath(
      fragment.slice(rootLength),
      tone,
    )
  }`;
}

function renderPkgEllipsis(
  ellipsis: string,
  position: number,
  identity: PkgIdentity,
  tone?: t.AnsiColor.Name,
): string {
  return position >= identity.root.length
    ? renderPkgSubpath(ellipsis, tone)
    : renderTitle(ellipsis, tone);
}

function renderPkgSubpath(subpath: string, tone?: t.AnsiColor.Name): string {
  return subpath ? c.dim(applyTone(subpath, tone)) : '';
}

/** Plain custom identities inherit an explicit tone; rendered identities retain caller styling. */
function renderCustomTitle(title: string, tone?: t.AnsiColor.Name): string {
  if (!tone || stripAnsi(title) !== title) return title;
  return renderTitle(title, tone);
}

function renderHr(options: t.CliFormatHeader.Options, width: number): string {
  const override = options.hr || undefined;
  const color = override?.color ?? options.tone;
  const weight = override?.weight;
  return hr({
    width,
    ...(color ? { color } : {}),
    ...(weight ? { weight } : {}),
  });
}

function resolveWidth(input?: number): number {
  if (input === undefined) return Text.Width.fit();
  if (!Num.Is.finite(input) || input <= 0) return 0;
  return Math.floor(input);
}

function normalizeTitle(input?: string): string | undefined {
  const value = normalizeText(input);
  return stripAnsi(value).trim() ? value : undefined;
}

function normalizeText(input?: unknown): string {
  return Is.string(input) ? input.trim() : '';
}

type ResolvedPackageInput = {
  readonly pkg: t.Pkg;
  readonly subpath?: unknown;
};

type PkgIdentity = {
  readonly root: string;
  readonly subpath: string;
  readonly plain: string;
};

type PkgIdentityPair = {
  readonly full: PkgIdentity;
  readonly compact: PkgIdentity;
};

function resolvePackageInput(
  input?: t.CliFormatHeader.PackageIdentity,
): ResolvedPackageInput | undefined {
  if (Is.object(input) && Obj.hasOwn(input, 'root')) {
    const root = input.root;
    if (!Pkg.Is.pkg(root)) return;
    return {
      pkg: root,
      ...(Obj.hasOwn(input, 'subpath') ? { subpath: input.subpath } : {}),
    };
  }
  return Pkg.Is.pkg(input) ? { pkg: input } : undefined;
}

function resolvePkgIdentity(name: string, subpathInput?: unknown): PkgIdentityPair {
  const parsed = splitPkgName(name);
  const subpath = joinPkgSubpath(parsed.subpath, subpathInput);
  return {
    full: createPkgIdentity(parsed.root, subpath),
    compact: createPkgIdentity(compactPkgRoot(parsed.root), subpath),
  };
}

function splitPkgName(name: string): { root: string; subpath: string } {
  const firstSlash = name.indexOf('/');
  if (firstSlash < 0 || !name.startsWith('@')) return splitUnscopedPkgName(name, firstSlash);

  const subpathAt = name.indexOf('/', firstSlash + 1);
  if (subpathAt < 0) return { root: name, subpath: '' };
  return { root: name.slice(0, subpathAt), subpath: name.slice(subpathAt + 1) };
}

function splitUnscopedPkgName(name: string, firstSlash: number): { root: string; subpath: string } {
  if (firstSlash < 0) return { root: name, subpath: '' };
  return { root: name.slice(0, firstSlash), subpath: name.slice(firstSlash + 1) };
}

function compactPkgRoot(root: string): string {
  const firstSlash = root.indexOf('/');
  if (!root.startsWith('@') || firstSlash < 0) return root;
  return root.slice(firstSlash + 1) || root;
}

function createPkgIdentity(root: string, subpath: string): PkgIdentity {
  const suffix = subpath ? `/${subpath}` : '';
  return { root, subpath: suffix, plain: `${root}${suffix}` };
}

function joinPkgSubpath(...parts: readonly unknown[]): string {
  const values: string[] = [];
  for (const part of parts) {
    const parsed = Pkg.Subpath.parse(part);
    if (parsed.kind === 'valid') values.push(parsed.value);
  }
  return values.join('/');
}

function applyTone(text: string, tone?: t.AnsiColor.Name): string {
  return tone ? Color.foreground[tone](text) : text;
}
