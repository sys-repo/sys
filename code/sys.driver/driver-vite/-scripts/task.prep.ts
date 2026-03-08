import { type t, DenoDeps, DenoFile, Err, Path } from './common.ts';
import { rewriteImport, rewriteJson } from './task.prep.u.ts';

const SPECIFIER = 'npm:esbuild';
const PATTERN = /from 'npm:esbuild@[^']+'/;
const DRIVER_PKG = '@sys/driver-vite';
const BRIDGE_IMPORT_PATTERN = /from 'jsr:@sys\/driver-vite(?:@[^']+)?'/;

type DenoFileVersionLib = Pick<t.DenoFileLib, 'workspaceVersion'>;

export async function syncTransportLoaderImport(args: { depsPath: string; targetPath: string }) {
  const { depsPath, targetPath } = args;
  const loaded = await DenoDeps.from(depsPath);
  if (loaded.error) throw loaded.error;

  const specifier = DenoDeps.findImport(loaded.data?.deps, SPECIFIER);
  if (!specifier) {
    const cause = new Error(`Source: ${depsPath}`);
    throw Err.std(`Failed to find canonical dependency import: ${SPECIFIER}`, { cause });
  }

  await rewriteImport({
    targetPath,
    pattern: PATTERN,
    replacement: `from '${specifier}'`,
  });
}

export async function syncPublishedBridgeImport(args: {
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

export async function syncPublishedBridgeImports(args: {
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

  const current = await Deno.readTextFile(Path.resolve(targetPath));
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

export async function main() {
  const ws = await DenoFile.workspace();
  const depsPath = Path.join(ws.dir, 'deps.yaml');
  await syncTransportLoaderImport({
    depsPath,
    targetPath: './src/m.vite.transport/u.load.ts',
  });
  await syncPublishedBridgeImport({
    rootDenoJson: ws.file,
    targetPath: './src/-test/vite.sample-bridge-published/vite.config.ts',
    denoFile: DenoFile,
  });
  await syncPublishedBridgeImports({
    rootDenoJson: ws.file,
    targetPath: './src/-test/vite.sample-bridge-published/imports.json',
    denoFile: DenoFile,
  });
}

if (import.meta.main) await main();
