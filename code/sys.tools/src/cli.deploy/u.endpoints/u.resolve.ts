import { type t, Fs, Path } from '../common.ts';

const resolvePath = (baseAbs: string, p: string): string => {
  const s = Fs.Tilde.expand(String(p ?? '').trim());
  if (Path.Is.absolute(s)) return s;
  return Path.resolve(baseAbs, s);
};

const resolveBases = (cwd: t.StringDir, doc: t.DeployTool.Config.EndpointYaml.Doc) => {
  const cwdAbs = Path.resolve(cwd, '.');
  const sourceRoot = String(doc.source?.dir ?? '').trim() || '.';
  const stagingRoot = String(doc.staging?.dir ?? '').trim() || '.';
  const sourceBaseAbs = resolvePath(cwdAbs, sourceRoot);
  const stagingBaseAbs = resolvePath(cwdAbs, stagingRoot);
  return { sourceRoot, stagingRoot, sourceBaseAbs, stagingBaseAbs };
};

export { resolveBases, resolvePath };
