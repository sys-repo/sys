import { type t, Fs, pkg, Yaml } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { CrdtDocSchema } from './u.schema.ts';
import { CrdtDocYamlErrorCode, validateDocumentYamlText } from './u.validate.ts';
import { Schema } from '@sys/schema';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const DOCS_DIR = `-config/${ROOT}.crdt.docs` satisfies t.CrdtTool.DocumentYaml.DirName;
const DOCS_EXT = '.yaml' satisfies t.CrdtTool.DocumentYaml.Ext;

export const CrdtDocsFs = {
  dir: DOCS_DIR,
  ext: DOCS_EXT,

  fileOf(name: string): t.StringPath {
    return `${DOCS_DIR}/${name}${DOCS_EXT}`;
  },

  async ensureDir(cwd: t.StringDir) {
    await Fs.ensureDir(Fs.join(cwd, DOCS_DIR));
  },

  async list(cwd: t.StringDir): Promise<t.StringFile[]> {
    const dir = Fs.join(cwd, DOCS_DIR);
    if (!(await Fs.exists(dir))) return [];
    const files: t.StringFile[] = [];
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile) continue;
      if (!entry.name.endsWith(DOCS_EXT)) continue;
      files.push(Fs.join(dir, entry.name));
    }
    return files;
  },

  async readYaml(path: t.StringPath): Promise<t.CrdtTool.DocumentYaml.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err = Yaml.Error.synthetic({
        message: 'Document YAML file does not exist.',
        code: CrdtDocYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read document YAML file.',
        code: CrdtDocYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    return validateDocumentYamlText(read.data ?? '');
  },

  async writeDoc(path: t.StringPath, doc: t.CrdtTool.DocumentYaml.Doc) {
    await Fs.ensureDir(Fs.dirname(path));
    const text = CrdtDocSchema.stringify(doc);
    await Fs.write(path, text);
  },
} as const;
