import { Fs } from '@sys/fs';
import type * as t from '@sys/types';
import { PATH, assertVersion, pinTmplSpecifier } from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  const [tmplDenoRaw, cliTextRaw] = await Promise.all([Fs.readJson<t.Json>(path.tmplDenoJson), Fs.readText(path.cliTmplFile)]);
  if (!tmplDenoRaw.ok || !tmplDenoRaw.data) {
    throw new Error(`Failed to read JSON: ${path.tmplDenoJson}`);
  }
  if (!cliTextRaw.ok || typeof cliTextRaw.data !== 'string') {
    throw new Error(`Failed to read text: ${path.cliTmplFile}`);
  }

  const version = assertVersion(tmplDenoRaw.data, path.tmplDenoJson);
  const next = pinTmplSpecifier(cliTextRaw.data, version);

  if (next === cliTextRaw.data) {
    console.info(`unchanged  ${Fs.trimCwd(path.cliTmplFile)}`);
    return;
  }

  await Fs.write(path.cliTmplFile, next);
  console.info(`updated    ${Fs.trimCwd(path.cliTmplFile)}`);
}
