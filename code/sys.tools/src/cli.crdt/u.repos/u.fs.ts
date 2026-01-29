import { type t, Fs, pkg, Yaml } from '../common.ts';
import { CrdtRepoSchema } from './u.schema.ts';
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
