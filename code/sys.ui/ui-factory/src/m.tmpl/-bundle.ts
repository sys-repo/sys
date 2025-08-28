/**
 * Generate a deterministic JSON bundle from ../-tmpl/files into ./-bundle.json
 * Usage: deno task tmpl:prep
 */
import { FileMap, Fs, Path, c } from './common.ts';

const SRC_DIR = Path.resolve('./src/-tmpl');
const OUT_FILE = Path.resolve('./src/m.tmpl/-bundle.json');

if (import.meta.main) main();

/**
 * Main: entry point.
 */
async function main() {
  const filter: Parameters<typeof FileMap.bundle>[1] = () => true;
  const map = await FileMap.bundle(SRC_DIR, filter);
  const sorted = sortKeys(map);
  await Fs.ensureDir(Path.dirname(OUT_FILE));
  await Fs.writeJson(OUT_FILE, sorted);

  // Print output:
  const suffix = `${Object.keys(sorted).length} entries`;
  const out = Path.relative('.', OUT_FILE);
  console.info(c.gray(`${c.green('Wrote')} ${out} (${c.white(suffix)})`));
  console.info();
}

/**
 * Helpers:
 */
function sortKeys<T extends Record<string, string>>(input: T): T {
  const out: Record<string, string> = {};
  for (const k of Object.keys(input).sort()) out[k] = input[k];
  return out as T;
}
