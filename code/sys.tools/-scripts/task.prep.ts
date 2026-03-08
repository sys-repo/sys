import { Fs } from '@sys/fs';
import { c } from '@sys/cli';
import { DenoFile } from '@sys/driver-deno/runtime';
import { PATH, pinTmplSpecifier, resolveTmplVersion } from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  const cliTextRaw = await Fs.readText(path.cliTmplFile);
  if (!cliTextRaw.ok || typeof cliTextRaw.data !== 'string') {
    throw new Error(`Failed to read text: ${path.cliTmplFile}`);
  }

  const version = await resolveTmplVersion(path.rootDenoJson, DenoFile);
  const next = pinTmplSpecifier(cliTextRaw.data, version);

  if (next === cliTextRaw.data) {
    console.info(`${c.cyan('unchanged')}  ${c.gray(Fs.trimCwd(path.cliTmplFile))}`);
    return;
  }

  await Fs.write(path.cliTmplFile, next);
  console.info(`updated    ${Fs.trimCwd(path.cliTmplFile)}`);
}
