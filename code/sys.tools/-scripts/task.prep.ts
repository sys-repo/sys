import { Fs } from '@sys/fs';
import { c } from '@sys/cli';
import { DenoFile } from '@sys/driver-deno/runtime';
import { PATH, pinPassthrough, prepTargets, resolveWorkspaceVersion, type PrepTarget } from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  for (const target of prepTargets(root)) {
    await prepTarget(target);
  }
}

async function prepTarget(target: PrepTarget) {
  const source = await readText(target.path);
  const version = await resolveWorkspaceVersion(target.target.upstream.name, path.rootDenoJson, DenoFile);
  const next = pinPassthrough(source, target.target, version);
  await writeIfChanged(target.path, source, next);
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
