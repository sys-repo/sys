import type * as dt from '@sys/driver-deno/t';
import { Fs } from '@sys/fs';
import {
  PASSTHROUGH_TARGETS,
  pinPassthroughSpecifier,
  type PassthroughTarget,
} from '../../../-scripts/u.passthrough.ts';

export type PrepPaths = {
  rootDenoJson: string;
  cliTmplFile: string;
  cliCodeFile: string;
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
      cliTmplFile: Fs.join(root, 'code/sys.tools/src/cli.tmpl/m.cli.ts'),
      cliCodeFile: Fs.join(root, 'code/sys.tools/src/cli.code/m.cli.ts'),
    };
  },
} as const;

export const TARGET = {
  tmpl(path: PrepPaths): PrepTarget {
    const target = toTarget('@sys/tmpl');
    return {
      path: path.cliTmplFile,
      file: target.consumer.fileFromRoot,
      target,
    };
  },
  code(path: PrepPaths): PrepTarget {
    const target = toTarget('@sys/driver-agent');
    return {
      path: path.cliCodeFile,
      file: target.consumer.fileFromRoot,
      target,
    };
  },
} as const;

export async function resolveTmplVersion(
  source: string,
  denoFile: DenoFileVersionLib,
): Promise<string> {
  return await resolveWorkspaceVersion('@sys/tmpl', source, denoFile);
}

export async function resolveDriverAgentVersion(
  source: string,
  denoFile: DenoFileVersionLib,
): Promise<string> {
  return await resolveWorkspaceVersion('@sys/driver-agent', source, denoFile);
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

export function pinDriverAgentPiCliSpecifier(source: string, version: string): string {
  return pinPassthroughSpecifier(source, toTarget('@sys/driver-agent'), version);
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
