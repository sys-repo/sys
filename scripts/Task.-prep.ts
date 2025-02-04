import { DenoDeps, Fs } from './common.ts';

/**
 * Prepare the [package.json] and [deno.json] files
 * from definieions within `imports.yaml`
 */
export async function main() {
  const res = await DenoDeps.fromYaml('./imports.yaml');
  if (res.error) return console.error(res.error);

  await Fs.writeJson('./package.json', DenoDeps.toPackageJson(res.data));
  await Fs.writeJson('./deno.imports.json', DenoDeps.toDenoJson(res.data));
}
