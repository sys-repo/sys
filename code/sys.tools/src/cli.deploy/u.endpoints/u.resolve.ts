import { Fs, Path, type t } from '../common.ts';

type ResolvePathOptions = {
  expandTilde?: (input: string) => string;
};

const isHomePath = (input: string): boolean => input === '~' || input.startsWith('~/');

const resolvePath = (baseAbs: string, p: string, options: ResolvePathOptions = {}): string => {
  const raw = String(p ?? '');
  const s = expandHomePath(raw, options.expandTilde ?? Fs.Tilde.expand);
  if (Path.Is.absolute(s)) return s;
  return Path.resolve(baseAbs, s);
};

function expandHomePath(input: string, expand: (input: string) => string): string {
  if (!isHomePath(input)) return input;

  let resolved: string;
  try {
    resolved = expand(input);
  } catch (cause) {
    throw new Error(`HOME authority is required to resolve path: ${input}`, { cause });
  }

  if (resolved === input) {
    throw new Error(`HOME value is required to resolve path: ${input}`);
  }
  return resolved;
}

const resolveBases = (cwd: t.StringDir, doc: t.DeployTool.Config.EndpointYaml.Doc) => {
  const cwdAbs = Path.resolve(cwd, '.');
  const sourceRoot = String(doc.source?.dir ?? '.');
  const stagingRoot = String(doc.staging.dir);
  const sourceBaseAbs = resolvePath(cwdAbs, sourceRoot);
  const stagingBaseAbs = resolvePath(cwdAbs, stagingRoot);
  return { sourceRoot, stagingRoot, sourceBaseAbs, stagingBaseAbs };
};

export { isHomePath, resolveBases, resolvePath };
