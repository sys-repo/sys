import { type t, DenoModule, Path, PATHS } from './common.ts';

const ignore = `
node_modules/
-backup/
-backup/**
.vitepress/cache/
.tmp/
`;

/**
 * Create a backup snapshot.
 */
export const backup: t.VitepressLib['backup'] = async (args) => {
  const { force, message, includeDist = false } = args;
  const source = Path.resolve(args.dir);

  const filter: t.FsPathFilter = (absolute) => {
    const relative = absolute.startsWith(source) ? absolute.slice(source.length + 1) : absolute;

    if (relative.startsWith(PATHS.backup)) return false;
    if (relative.startsWith(PATHS.vitepressCache)) return false;
    if (relative.startsWith(PATHS.dist)) return !!args.includeDist;

    return true;
  };

  return DenoModule.backup({ source, filter, message, force, ignore, includeDist });
};
