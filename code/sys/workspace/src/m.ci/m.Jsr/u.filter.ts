import { Err, Is, Jsr, Semver, type t } from '../common.ts';
import { loadModule, type Module } from './u.ts';

type VersionFilter = t.WorkspaceCi.Jsr.TextArgs['versionFilter'];

export async function filterModules(
  cwd: t.StringDir,
  paths: readonly t.StringPath[],
  versionFilter: VersionFilter = 'all',
) {
  const modules = await Promise.all(paths.map((path) => loadModule(cwd, path)));
  if (versionFilter !== 'ahead') return modules;

  const results = await Promise.all(modules.map((module) => filterAhead(module)));
  return results.filter((item): item is Module => !!item);
}

async function filterAhead(module: Module): Promise<Module | undefined> {
  const res = await Jsr.Fetch.Pkg.versions(module.name);
  if (!res.ok) {
    if (res.status === 404 || Is.httpStatus(res.error, 404)) {
      return module;
    }
    const cause = res.error;
    throw Err.std(`Failed to fetch JSR package versions: ${module.name}`, { cause });
  }

  const data = res.data;
  if (!data) return module;

  const local = module.version;
  const latest = data.latest;
  const published = data.versions?.[local];
  if (published) return undefined;
  if (Semver.Is.lessThan(local, latest)) {
    throw new Error(`Local version is behind JSR latest: ${module.name}@${local} < ${latest}`);
  }
  if (Semver.Is.eql(local, latest)) return undefined;
  return module;
}
