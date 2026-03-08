import { type t, DenoDeps, DenoFile, Err, Path } from './common.ts';
import { rewriteImport } from './task.prep.u.ts';

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

export async function main() {
  const ws = await DenoFile.workspace();
  const depsPath = Path.join(ws.dir, 'deps.yaml');
  await syncTransportLoaderImport({
    depsPath,
    targetPath: './src/m.vite.transport/u.load.ts',
  });
  await syncPublishedBridgeImport({
    rootDenoJson: ws.file,
    targetPath: './src/-test/vite.sample-bridge/vite.config.ts',
    denoFile: DenoFile,
  });
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
