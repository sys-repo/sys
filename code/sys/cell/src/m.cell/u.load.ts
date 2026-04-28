import { type t, Yaml } from './common.ts';
import { CellSchema } from './u.schema/mod.ts';

/**
 * FS is intentionally isolated to this loader seam.
 *
 * The public `@sys/cell` import graph must stay FS-free so descriptor types and
 * schema can be imported in browser/Vite contexts. `Cell.load(...)` lazy-loads
 * this module when a caller explicitly asks to read a Cell folder from disk.
 */
import { Fs } from '@sys/fs';

const DescriptorFile = '-config/@sys.cell/cell.yaml';

export const loadCell: t.Cell.Lib['load'] = async (root) => {
  const cellRoot = Fs.resolve(root) as t.StringDir;
  const descriptorPath = Fs.join(cellRoot, DescriptorFile) as t.StringPath;

  const read = await Fs.readText(descriptorPath);
  if (!read.ok) {
    throw new Error(`Cell.load: failed to read descriptor: ${descriptorPath}`);
  }

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    throw new Error(`Cell.load: failed to parse descriptor YAML: ${descriptorPath}`, {
      cause: parsed.error,
    });
  }

  const validated = CellSchema.Descriptor.validate(parsed.data);
  if (!validated.ok) {
    const message = validated.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Cell.load: invalid descriptor: ${message}`);
  }

  return {
    root: cellRoot,
    paths: { descriptor: descriptorPath },
    descriptor: parsed.data as t.Cell.Descriptor,
  };
};
