import type * as dt from '@sys/driver-deno/t';
import { Fs } from '@sys/fs';
import {
  PASSTHROUGH_TARGETS,
  pinPassthroughSpecifier,
  type PassthroughTarget,
} from '../../../-scripts/u.passthrough.ts';

export type PrepPaths = {
  rootDenoJson: string;
};

export type PrepTarget = {
  readonly path: string;
  readonly file: string;
  readonly target: PassthroughTarget;
};

export type DenoFileVersionLib = Pick<dt.DenoFileLib, 'workspaceVersion'>;

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      rootDenoJson: Fs.join(root, 'deno.json'),
    };
  },
} as const;

export function prepTargets(root: string): readonly PrepTarget[] {
  return PASSTHROUGH_TARGETS
    .filter((target) => target.consumer.path === 'code/sys.tools')
    .map((target) => ({
      path: Fs.join(root, target.consumer.fileFromRoot),
      file: target.consumer.fileFromRoot,
      target,
    }));
}

export async function resolveTmplVersion(
  source: string,
  denoFile: DenoFileVersionLib,
): Promise<string> {
  return await resolveWorkspaceVersion('@sys/tmpl', source, denoFile);
}

export async function resolveDriverPiVersion(
  source: string,
  denoFile: DenoFileVersionLib,
): Promise<string> {
  return await resolveWorkspaceVersion('@sys/driver-pi', source, denoFile);
}

export async function resolveWorkspaceVersion(
  name: string,
  source: string,
  denoFile: DenoFileVersionLib,
): Promise<string> {
  const version = await denoFile.workspaceVersion(name, source, { walkup: false });
  if (typeof version !== 'string') {
    throw new Error(`Missing workspace version for package "${name}": ${source}`);
  }
  return version;
}

export function pinTmplSpecifier(source: string, version: string): string {
  return pinPassthroughSpecifier(source, toTarget('@sys/tmpl'), version);
}

export function pinDriverPiCliSpecifier(source: string, version: string): string {
  return pinPassthroughSpecifier(source, toTarget('@sys/driver-pi'), version);
}

export function pinPassthrough(
  source: string,
  target: PassthroughTarget,
  version: string,
): string {
  return pinPassthroughSpecifier(source, target, version);
}

function toTarget(name: string): PassthroughTarget {
  const target = PASSTHROUGH_TARGETS.find((item) => item.upstream.name === name);
  if (!target) throw new Error(`Missing passthrough target for package "${name}"`);
  return target;
}
