import { describe, expect, it } from '../-test.ts';
import { Dir, Env, FileMap, Fs, Path, Pkg, Watch } from '../mod.ts';
import { FsCapability } from '../m.Fs.capability/mod.ts';
import { Wrangle as CopyWrangle } from '../m.Fs/u/u.copy.util.ts';
import { Glob } from '../m.Glob/mod.ts';
import { JsonFile } from '../m.JsonFile/mod.ts';

describe('fs namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      Fs,
      Fs.Is,
      Fs.Path,
      Fs.Size,
      Fs.Watch,
      Fs.Fmt,
      Fs.Tilde,
      Fs.Capability,
      Path,
      Dir,
      Dir.Hash,
      Env,
      Env.Is,
      FileMap,
      FileMap.Is,
      FileMap.Is.supported,
      FileMap.Is.contentType,
      FileMap.Data,
      FileMap.Data.contentType,
      Pkg,
      Pkg.Is,
      Pkg.Subpath,
      Pkg.Dist,
      Pkg.Dist.Is,
      Pkg.Dist.Compat,
      Pkg.Dist.Part,
      Pkg.Dist.Log,
      Pkg.Dist.Local,
      Pkg.Dist.Pinned,
      Watch,
      Glob,
      JsonFile,
      JsonFile.Singleton,
      FsCapability,
      FsCapability.Files,
      FsCapability.Files.Readonly,
      FsCapability.Files.Writable,
      FsCapability.Rooted,
      FsCapability.Rooted.Is,
      CopyWrangle,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
