import { type t, Fs, Json, Schema, SlugSchema } from './common.ts';

type DescriptorEntry = {
  readonly dir: t.StringDir;
  readonly bundle: t.BundleDescriptor;
};

export async function writeDistClientFiles(entries: Iterable<DescriptorEntry>): Promise<number> {
  const byDir = new Map<string, t.BundleDescriptor[]>();
  for (const entry of entries) {
    const dir = String(entry.dir ?? '').trim();
    if (!dir) continue;
    const list = byDir.get(dir) ?? [];
    list.push(entry.bundle);
    byDir.set(dir, list);
  }

  let written = 0;
  for (const [dir, bundles] of byDir.entries()) {
    if (bundles.length === 0) continue;
    const doc: t.BundleDescriptorDoc = { bundles };
    if (!Schema.Value.Check(SlugSchema.BundleDescriptor.Schema, doc)) {
      const errors = [...Schema.Value.Errors(SlugSchema.BundleDescriptor.Schema, doc)];
      const message = formatErrors(errors);
      throw new Error(`dist.client.json schema validation failed @ ${dir}:\n${message}`);
    }

    await Fs.ensureDir(dir);
    const path = Fs.join(dir, 'dist.client.json');
    await Fs.write(path, Json.stringify(doc));
    written += 1;
  }

  return written;
}

function formatErrors(errors: readonly t.ValueError[]): string {
  return errors
    .map((err) => `${String(err.path ?? '').trim() || '<root>'}: ${err.message}`)
    .join('\n  ');
}
