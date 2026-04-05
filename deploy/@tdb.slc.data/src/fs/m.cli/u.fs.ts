import { type t, Fs, pkg, YamlConfig } from './common.ts';

export const StageProfilePaths = {
  root: YamlConfig.File.fromPkg('-config', pkg).dir.name,
  ext: '.yaml' as t.StringPath,
  targetDir: './.tmp/staging.slc-data' as t.StringPath,
  get dir() {
    return Fs.join('-config', StageProfilePaths.root, 'stage');
  },
} as const;

/**
 * Filesystem facts for staged-data CLI profiles.
 */
export const StageProfileFs = {
  configDir(cwd: t.StringDir): t.StringDir {
    return Fs.join(cwd, StageProfilePaths.dir) as t.StringDir;
  },

  targetRoot(cwd: t.StringDir): t.StringDir {
    return Fs.join(cwd, StageProfilePaths.targetDir) as t.StringDir;
  },

  target(cwd: t.StringDir, mount: t.StringId): t.StringDir {
    return Fs.join(StageProfileFs.targetRoot(cwd), mount) as t.StringDir;
  },

  path(cwd: t.StringDir, profile: t.StringId): t.StringFile {
    return Fs.join(StageProfileFs.configDir(cwd), `${profile}${StageProfilePaths.ext}`) as t.StringFile;
  },
} as const;
