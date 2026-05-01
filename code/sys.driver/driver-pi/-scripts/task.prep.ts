import { c } from '@sys/cli';
import { DenoDeps } from '@sys/driver-deno/runtime';
import { Fs } from '@sys/fs';
import { PATH, pinPiCodingAgentImport, resolvePiCodingAgentImport } from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  const source = await readText(path.resolvePkgFile);
  const specifier = await resolvePiCodingAgentImport(path.rootDepsYaml, DenoDeps);
  const next = pinPiCodingAgentImport(source, specifier);
  await writeIfChanged(path.resolvePkgFile, source, next);
}

async function readText(file: string) {
  const res = await Fs.readText(file);
  if (!res.ok || typeof res.data !== 'string') throw new Error(`Failed to read text: ${file}`);
  return res.data;
}

async function writeIfChanged(file: string, prev: string, next: string) {
  if (next === prev) {
    console.info(`${c.cyan('unchanged')}  ${c.gray(Fs.trimCwd(file))}`);
    return;
  }
  await Fs.write(file, next);
  console.info(`updated    ${Fs.trimCwd(file)}`);
}
