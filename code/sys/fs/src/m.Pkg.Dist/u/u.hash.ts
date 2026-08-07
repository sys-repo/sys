import { DirHash } from '../../m.Dir.Hash/mod.ts';
import { Arr, CompositeHash, D, Fs, Ignore, Path, Str, type t } from '../common.ts';
import { load } from './u.load.ts';

type IgnorePolicy = {
  readonly rules: readonly string[];
  readonly digest: t.StringHash;
  readonly matcher: ReturnType<typeof Ignore.create>;
};

export async function hashes(
  path: t.StringDir,
  options: {
    filter?: (path: t.StringPath) => boolean;
    trustChildDist?: boolean;
    onHashProgress?: (e: t.Dir.Hash.Compute.ProgressEvent) => t.Awaitable<void>;
    ignore?: IgnorePolicy;
  } = {},
) {
  const { filter, trustChildDist = false, onHashProgress, ignore: policy } = options;
  if (!trustChildDist) return await hashesBase(path, filter, onHashProgress, policy);
  const children = await childDists(path);
  if (children.length === 0) return await hashesBase(path, filter, onHashProgress, policy);

  const childAbs = children.map((child) => Path.join(path, child.rootRel));
  const mergedFilter = (value: string) => {
    if (!includeHashPart(value)) return false;
    if (policy && isIgnored(value, path, policy)) return false;
    if (childAbs.some((root) => value === root || value.startsWith(Path.join(root, '')))) {
      return false;
    }
    return filter ? filter(value) : true;
  };
  const res = await DirHash.compute(path, { filter: mergedFilter, onProgress: onHashProgress });
  const parts: t.DeepMutable<t.CompositeHashParts> = { ...res.hash.parts };
  for (const child of children) {
    for (const [childPath, uri] of Object.entries(child.dist.hash.parts)) {
      parts[Path.join(child.rootRel, Str.trimLeadingDotSlash(childPath))] = uri;
    }
  }
  const outParts: t.CompositeHashParts = { ...parts };
  return { digest: CompositeHash.digest(outParts), parts: outParts };
}

export async function hashesBase(
  path: t.StringDir,
  filter?: (path: t.StringPath) => boolean,
  onHashProgress?: (e: t.Dir.Hash.Compute.ProgressEvent) => t.Awaitable<void>,
  policy?: IgnorePolicy,
) {
  const mergedFilter = (value: string) => {
    if (!includeHashPart(value)) return false;
    if (policy && isIgnored(value, path, policy)) return false;
    return filter ? filter(value) : true;
  };
  return (await DirHash.compute(path, { filter: mergedFilter, onProgress: onHashProgress })).hash;
}

export async function bytes(dir: t.StringDir, files: t.StringFile[]) {
  const sizes: number[] = [];
  for (const file of files) sizes.push((await Fs.stat(Fs.join(dir, file)))?.size ?? 0);
  return sizes.reduce((total, size) => total + size, 0);
}

export function filepath(path: t.StringPath) {
  return path.endsWith('/dist.json') ? path : Fs.join(path, 'dist.json');
}

export async function ignore(input?: string | readonly string[]): Promise<IgnorePolicy> {
  const rules = Ignore.normalize([...D.hashPolicy.ignore.rules, ...(input ? [input].flat() : [])]);
  return { rules, digest: await Ignore.digest(rules), matcher: Ignore.create(rules) };
}

function includeHashPart(path: t.StringPath) {
  const name = Path.basename(path);
  return name !== 'dist.json' && name !== 'dist.json.sig';
}

function isIgnored(path: t.StringPath, root: t.StringDir, policy: IgnorePolicy) {
  return policy.matcher.isIgnored(path, Path.Is.absolute(path) ? root : undefined);
}

async function childDists(path: t.StringDir) {
  const entries = await Fs.glob(path, { includeDirs: false }).find('**/dist.json');
  const roots = entries.map((entry) =>
    Str.trimSlashes(Path.dirname(Str.trimLeadingDotSlash(Path.relative(path, entry.path))))
  ).filter((rel) => rel !== '.' && rel !== '');
  const top: string[] = [];
  for (const root of Arr.uniq(roots).sort((a, b) => a.length - b.length)) {
    if (!top.some((parent) => root === parent || root.startsWith(`${parent}/`))) top.push(root);
  }
  const children: Array<{ rootRel: string; dist: t.DistPkg }> = [];
  for (const rootRel of top) {
    const loaded = await load(Path.join(path, rootRel));
    if (loaded.dist) children.push({ rootRel, dist: loaded.dist });
  }
  return children;
}
