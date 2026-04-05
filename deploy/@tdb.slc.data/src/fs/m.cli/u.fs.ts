import { type t, Fs, pkg, YamlConfig } from './common.ts';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const DIR = Fs.join('-config', ROOT, 'stage');
const EXT = '.yaml' as t.StringPath;
const TARGET_DIR = './.tmp/staging.slc-data' as t.StringPath;
const DEFAULT_NAME = 'sample-1';

/**
 * Filesystem facts for staged-data CLI profiles.
 */
export const StageProfileFs = {
  root: ROOT,
  dir: DIR,
  ext: EXT,
  defaultName: DEFAULT_NAME,
  targetDir: TARGET_DIR,

  target(cwd: t.StringDir, mount: t.StringId): t.StringDir {
    return Fs.join(cwd, TARGET_DIR, mount) as t.StringDir;
  },

  path(cwd: t.StringDir, profile: t.StringId): t.StringFile {
    return Fs.join(cwd, DIR, `${profile}${EXT}`) as t.StringFile;
  },
} as const;
