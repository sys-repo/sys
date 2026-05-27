import { type t, Yaml } from './common.ts';
import { CellPaths } from './u.paths.ts';
import { CellSchema } from './u.schema/mod.ts';

/**
 * WHAT: this file is the only Cell descriptor filesystem read seam.
 * WHY: the public `@sys/cell` graph must stay FS-free for browser/Vite descriptor and schema imports.
 */
import { Fs } from '@sys/fs';

type DescriptorSelection = {
  readonly path: t.StringPath;
  readonly compatibility?: t.Cell.LoadCompatibility;
};

export const loadCell: t.Cell.Lib['load'] = async (root = Fs.cwd('process')) => {
  const cellRoot = Fs.resolve(root);
  const selection = await selectDescriptor(cellRoot);
  const descriptorPath = selection.path;

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
    ...(selection.compatibility ? { compatibility: selection.compatibility } : {}),
  };
};

/**
 * Helpers:
 */
async function selectDescriptor(root: t.StringDir): Promise<DescriptorSelection> {
  const canonicalDescriptor = Fs.join(root, CellPaths.descriptor);
  const legacyDescriptor = Fs.join(root, CellPaths.legacy.descriptor);
  const [hasCanonical, hasLegacy] = await Promise.all([
    Fs.exists(canonicalDescriptor),
    Fs.exists(legacyDescriptor),
  ]);

  if (hasCanonical && hasLegacy) {
    throw new Error(
      `Cell.load: multiple descriptors found: ${canonicalDescriptor}; ${legacyDescriptor}. Resolve the descriptor conflict before loading.`,
    );
  }

  if (hasCanonical) return { path: canonicalDescriptor };

  if (hasLegacy) {
    return {
      path: legacyDescriptor,
      compatibility: {
        kind: 'legacy-descriptor',
        message:
          `Cell.load: loaded legacy descriptor ${legacyDescriptor}. Move it to ${canonicalDescriptor}; legacy fallback is temporary.`,
        legacyDescriptor,
        canonicalDescriptor,
      },
    };
  }

  throw new Error(
    `Cell.load: failed to find descriptor. Checked canonical ${canonicalDescriptor}; legacy fallback ${legacyDescriptor}.`,
  );
}
