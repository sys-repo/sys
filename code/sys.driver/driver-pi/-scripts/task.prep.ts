import { c } from '@sys/cli';
import { DenoDeps } from '@sys/driver-deno/runtime';
import { Fs } from '@sys/fs';
import { bundleOcr } from '../src/m.core/m.extension/m.ocr/-bundle/mod.ts';
import { bundleSandboxFs } from '../src/m.core/m.extension/m.sandbox.fs/-bundle/mod.ts';
import { bundlePiHelp } from '../src/m.core/m.help/-bundle/mod.ts';
import { PATH, pinPiAgentImport, resolvePiAgentImport } from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  await bundleSandboxFs();
  await bundleOcr();
  await bundlePiHelp();

  const source = await readText(path.resolvePkgFile);
  const specifier = await resolvePiAgentImport(path.rootDepsYaml, DenoDeps);
  const next = pinPiAgentImport(source, specifier);
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
