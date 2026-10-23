import { DenoFile, Err, type t } from './common.ts';
import { rewriteImport } from './task.prep.u.ts';

const DRIVER_PKG = '@sys/driver-vite';
const BRIDGE_IMPORT_PATTERN = /from 'jsr:@sys\/driver-vite(?:@[^']+)?'/;

export type DenoFileVersionLib = Pick<t.DenoFile.Lib, 'workspaceVersion'>;

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
  // Application imports stay pinned to verified published releases. Workspace bumps
  // advance the driver under test, not the external consumer's dependencies.
}
