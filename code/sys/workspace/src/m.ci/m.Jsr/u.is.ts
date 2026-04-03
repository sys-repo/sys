import { Fs, Jsr, Pkg, type t } from '../common.ts';

export function jsrPkgName(name: string) {
  return Jsr.Is.pkgName(name);
}

export async function publishable(
  path: t.StringPath,
  cwd = Fs.cwd(),
  options: t.WorkspaceCi.Jsr.Is.PublishableOptions = {},
) {
  const file = Fs.join(cwd, path, 'deno.json');
  const denojson = (await Fs.readJson<unknown>(file)).data;
  if (!Pkg.Is.pkg(denojson)) return false;
  if (!jsrPkgName(denojson.name)) return false;
  if (options.scopes && !options.scopes.some((scope) => denojson.name.startsWith(`${scope}/`))) {
    return false;
  }
  return denojson.version !== '0.0.0';
}
