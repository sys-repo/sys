import { type t, Fs, Is, pkg, Yaml } from '../common.ts';
import { CrdtRepoSchema, DEFAULT_PORTS } from './u.schema.ts';
import { CrdtRepoYamlErrorCode, validateRepoYamlText } from './u.validate.ts';
import { Schema } from '@sys/schema';

const REPO_DIR = `-config/${pkg.name}/crdt` satisfies t.CrdtTool.RepoYaml.DirName;
const REPO_EXT = '.yaml' satisfies t.CrdtTool.RepoYaml.Ext;
const REPO_NAME = 'repo';

export const CrdtReposFs = {
  dir: REPO_DIR,
  ext: REPO_EXT,
  name: REPO_NAME,

  file(): t.StringPath {
    return `${REPO_DIR}/${REPO_NAME}${REPO_EXT}`;
  },

  async ensureDir(cwd: t.StringDir) {
    await Fs.ensureDir(Fs.join(cwd, REPO_DIR));
  },

  async load(cwd: t.StringDir): Promise<t.CrdtTool.RepoYaml.Doc | undefined> {
    const path = Fs.join(cwd, CrdtReposFs.file());
    if (!(await Fs.exists(path))) return;
    const res = await CrdtReposFs.readYaml(path);
    if (!res.ok) return;
    return CrdtRepoSchema.normalize(res.doc);
  },

  async loadSync(cwd: t.StringDir): Promise<string[]> {
    const doc = await CrdtReposFs.load(cwd);
    if (!doc) return [];
    return doc.sync.filter((item) => item.enabled !== false).map((item) => item.endpoint);
  },

  async loadPorts(cwd: t.StringDir): Promise<{ repo: number; sync: number }> {
    const doc = await CrdtReposFs.load(cwd);
    const ports = doc?.ports ?? {};
    return {
      repo: Is.num(ports.repo) ? ports.repo : DEFAULT_PORTS.repo,
      sync: Is.num(ports.sync) ? ports.sync : DEFAULT_PORTS.sync,
    };
  },

  async readYaml(path: t.StringPath): Promise<t.CrdtTool.RepoYaml.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err = Yaml.Error.synthetic({
        message: 'Repo YAML file does not exist.',
        code: CrdtRepoYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read repo YAML file.',
        code: CrdtRepoYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    return validateRepoYamlText(read.data ?? '');
  },

  async writeDoc(path: t.StringPath, doc: t.CrdtTool.RepoYaml.Doc) {
    await Fs.ensureDir(Fs.dirname(path));
    const text = CrdtRepoSchema.stringify(doc);
    await Fs.write(path, text);
  },
} as const;
