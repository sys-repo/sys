import { Fs } from '@sys/fs';
import { Is, Str, type t } from './common.ts';

type O = Record<string, string>;

/** Derive Cell-owned defaults for a runtime service's start arguments. */
export async function deriveStartArgs(
  cell: t.Cell.Instance,
  service: t.Cell.Runtime.VerifiedService,
  base: t.Cell.Runtime.StartArgs,
): Promise<t.Cell.Runtime.StartArgs> {
  if (service.service.kind !== 'http-static') return base;

  const info = await staticViewInfo(cell, service.service);
  if (Object.keys(info).length === 0) return base;

  const current = Is.record(base.info) ? base.info : {};
  return { ...base, info: { ...current, ...info } };
}

async function staticViewInfo(
  cell: t.Cell.Instance,
  service: t.Cell.Runtime.Service,
): Promise<O> {
  const info: O = {};
  for (const id of service.for?.views ?? []) {
    const view = cell.descriptor.views?.[id];
    if (!view) continue;
    info[id] = `/${Str.trimLeadingSlashes(await viewPath(cell, view))}/`;
  }
  return info;
}

async function viewPath(cell: t.Cell.Instance, view: t.Cell.View.Descriptor): Promise<string> {
  if ('local' in view.source) return Str.trimLeadingDotSlash(view.source.local);
  return await pulledViewPath(cell, view.source.pull);
}

async function pulledViewPath(cell: t.Cell.Instance, path: t.Cell.Path): Promise<string> {
  const configPath = Fs.join(cell.root, Str.trimLeadingDotSlash(path));
  const TOOLS_PULL_SPEC = '@sys/' + 'tools/pull';
  const { Pull } = await import(/* @vite-ignore */ TOOLS_PULL_SPEC);
  const resolved = await Pull.resolve(configPath);
  const dirs = resolved.localDirs;

  if (dirs.length === 0) {
    throw new Error(`Cell.Runtime.start: pull config has no local materialization: ${configPath}`);
  }
  if (dirs.length > 1) {
    throw new Error(
      `Cell.Runtime.start: pull view source must resolve to one local materialization: ${configPath}`,
    );
  }
  return Str.trimLeadingDotSlash(dirs[0].dir);
}
