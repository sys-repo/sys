import { Fs } from '@sys/fs';
import { c } from '@sys/cli';
import { DenoFile } from '@sys/driver-deno/runtime';
import {
  PATH,
  pinDriverAgentPiCliSpecifier,
  pinTmplSpecifier,
  resolveDriverAgentVersion,
  resolveTmplVersion,
} from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  await prepTmpl();
  await prepCode();
}

async function prepTmpl() {
  const source = await readText(path.cliTmplFile);
  const version = await resolveTmplVersion(path.rootDenoJson, DenoFile);
  const next = pinTmplSpecifier(source, version);
  await writeIfChanged(path.cliTmplFile, source, next);
}

async function prepCode() {
  const source = await readText(path.cliCodeFile);
  const version = await resolveDriverAgentVersion(path.rootDenoJson, DenoFile);
  const next = pinDriverAgentPiCliSpecifier(source, version);
  await writeIfChanged(path.cliCodeFile, source, next);
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
