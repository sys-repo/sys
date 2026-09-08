import { Fs } from './common.ts';
import { bundleOcr } from '../src/m.core/m.extension/m.ocr/-bundle/mod.ts';
import { bundleSandboxFs } from '../src/m.core/m.extension/m.sandbox/-bundle/mod.ts';
import { bundleZipRead } from '../src/m.core/m.extension/m.zip/-bundle/mod.ts';
import { bundlePiHelp } from '../src/m.core/m.help/-bundle/mod.ts';
import { PATH, syncPiAgentImport } from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  await syncPiAgentImport(path);
  await bundleSandboxFs();
  await bundleOcr();
  await bundleZipRead();
  await bundlePiHelp();
}
