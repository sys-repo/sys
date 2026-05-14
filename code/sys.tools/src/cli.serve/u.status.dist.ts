import { Fs, Pkg, Str, type t, Time } from './common.ts';

const ONE_MINUTE = 60 * 1000;

/** Load optional dist metadata and project it into scalar service-status details. */
export async function distStatusDetails(
  location: t.ServeTool.LocationYaml.Location,
): Promise<readonly t.Service.Detail[]> {
  try {
    const dist = await loadDist(location);
    return dist ? detailsOf(dist) : [];
  } catch {
    return [];
  }
}

/**
 * Helpers:
 */
async function loadDist(
  location: t.ServeTool.LocationYaml.Location,
): Promise<t.DistPkg | undefined> {
  for (const dir of candidateDirs(location)) {
    const loaded = await Pkg.Dist.load(dir);
    if (loaded.dist) return loaded.dist;
  }
  return undefined;
}

function candidateDirs(location: t.ServeTool.LocationYaml.Location): readonly t.StringDir[] {
  const dirs = [
    ...Object.values(location.info ?? {})
      .filter(isPathInfo)
      .map((path) => pathInfoDir(location.dir, path)),
    location.dir,
  ];
  return [...new Set(dirs)];
}

function pathInfoDir(root: t.StringDir, path: string): t.StringDir {
  const suffix = Str.trimLeadingSlashes(path.trim());
  return suffix ? Fs.join(root, suffix) : root;
}

function detailsOf(dist: t.DistPkg): readonly t.Service.Detail[] {
  const details: t.Service.Detail[] = [];
  if (dist.pkg) details.push({ label: 'pkg', value: `${dist.pkg.name} ${dist.pkg.version}` });
  details.push({ label: 'dist', value: distText(dist) });
  return details;
}

function distText(dist: t.DistPkg): string {
  const size = Str.bytes(dist.build.size.total, { maximumFractionDigits: 1 });
  return `${distId(dist.hash.digest)}, ${size}, ${builtText(dist.build.time)}`;
}

function distId(digest: t.StringHash): string {
  return `#${digest.slice(-5)}`;
}

function builtText(time: t.UnixTimestamp): string {
  const date = Time.utc(new Date(time)).format('yyyy MMM dd');
  const elapsed = Time.elapsed(time, Date.now(), { round: 0 });
  if (!elapsed.ok || elapsed.msec < ONE_MINUTE) return date;
  return `${date} · ${elapsed.format()} ago`;
}

function isPathInfo(value: string) {
  return value.trim().startsWith('/');
}
