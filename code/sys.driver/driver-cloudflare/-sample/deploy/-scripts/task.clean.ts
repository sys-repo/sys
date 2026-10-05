import { Fs, ROOT } from './common.ts';

/** Remove this sample's generated files without reading deployment configuration. */
export async function cleanSample(root: string, options: { log?: boolean } = {}): Promise<void> {
  // Invalidate both records before touching outputs; stop on any deletion failure.
  const paths = [
    'dist.pins.json',
    'dist.selection.json',
    'dist',
    'dist.private',
    'dist.public',
    '.tmp',
  ];
  for (const path of paths) await Fs.remove(Fs.join(root, path), options);
}

if (import.meta.main) await cleanSample(ROOT, { log: true });
