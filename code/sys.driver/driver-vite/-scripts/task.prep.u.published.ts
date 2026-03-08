import { type t, DenoFile, Err } from './common.ts';
import { rewriteImport, rewriteJson } from './task.prep.u.ts';

const DRIVER_PKG = '@sys/driver-vite';
const BRIDGE_IMPORT_PATTERN = /from 'jsr:@sys\/driver-vite(?:@[^']+)?'/;

export type DenoFileVersionLib = Pick<t.DenoFileLib, 'workspaceVersion'>;

export async function syncPublishedFixtureImport(args: {
  rootDenoJson: string;
  targetPath: string;
  denoFile: DenoFileVersionLib;
}) {
  const { rootDenoJson, targetPath, denoFile } = args;
  const version = await denoFile.workspaceVersion(DRIVER_PKG, rootDenoJson, { walkup: false });
  if (!version) {
    const cause = new Error(`Source: ${rootDenoJson}`);
    throw Err.std(`Failed to resolve workspace version: ${DRIVER_PKG}`, { cause });
  }

  await rewriteImport({
    targetPath,
    pattern: BRIDGE_IMPORT_PATTERN,
    replacement: `from 'jsr:${DRIVER_PKG}@${version}'`,
  });
}

export async function syncPublishedFixtureImports(args: {
  rootDenoJson: string;
  targetPath: string;
  denoFile: DenoFileVersionLib;
}) {
  const { rootDenoJson, targetPath, denoFile } = args;

  async function versionFor(pkgName: string) {
    const version = await denoFile.workspaceVersion(pkgName, rootDenoJson, { walkup: false });
    if (!version) {
      const cause = new Error(`Source: ${rootDenoJson}`);
      throw Err.std(`Failed to resolve workspace version: ${pkgName}`, { cause });
    }
    return version;
  }

  const current = await Deno.readTextFile(targetPath);
  const parsed = JSON.parse(current) as { imports?: Record<string, string> };
  const pkgNames = [
    ...new Set(
      Object.keys(parsed.imports ?? {})
        .filter((specifier) => specifier.startsWith('@sys/'))
        .map((specifier) => specifier.split('/').slice(0, 2).join('/')),
    ),
  ].sort();
  const versionByPackage = Object.fromEntries(
    await Promise.all(pkgNames.map(async (pkgName) => [pkgName, await versionFor(pkgName)] as const)),
  );

  await rewriteJson<{ imports?: Record<string, string> }>({
    targetPath,
    update(currentJson) {
      const imports = currentJson.imports ?? {};
      return {
        ...currentJson,
        imports: Object.fromEntries(
          Object.entries(imports).map(([specifier, value]) => {
            if (!specifier.startsWith('@sys/')) return [specifier, value] as const;
            const pkgName = specifier.split('/').slice(0, 2).join('/');
            const suffix = specifier.slice(pkgName.length);
            return [specifier, `jsr:${pkgName}@${versionByPackage[pkgName]}${suffix}`] as const;
          }),
        ),
      };
    },
  });
}

export async function syncPublishedFixture(args: {
  rootDenoJson: string;
  dir: string;
  denoFile?: DenoFileVersionLib;
}) {
  const denoFile = args.denoFile ?? DenoFile;
  await syncPublishedFixtureImport({
    rootDenoJson: args.rootDenoJson,
    targetPath: `${args.dir}/vite.config.ts`,
    denoFile,
  });
  await syncPublishedFixtureImports({
    rootDenoJson: args.rootDenoJson,
    targetPath: `${args.dir}/imports.json`,
    denoFile,
  });
}
