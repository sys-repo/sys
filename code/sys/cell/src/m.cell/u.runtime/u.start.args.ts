import { Fs } from '@sys/fs';
import { Is, Str, type t, Yaml } from './common.ts';

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
): Promise<Record<string, string>> {
  const info: Record<string, string> = {};
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
  const read = await Fs.readText(configPath);
  if (!read.ok) throw new Error(`Cell.Runtime.start: failed to read pull config: ${configPath}`);

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    throw new Error(`Cell.Runtime.start: failed to parse pull config YAML: ${configPath}`, {
      cause: parsed.error,
    });
  }

  const dir = pullLocalDir(parsed.data);
  if (!dir) throw new Error(`Cell.Runtime.start: pull config has no local.dir: ${configPath}`);
  return Str.trimLeadingDotSlash(dir);
}

function pullLocalDir(input: unknown): string | undefined {
  if (!Is.record(input) || !Array.isArray(input.bundles)) return undefined;
  for (const bundle of input.bundles) {
    if (Is.record(bundle) && Is.record(bundle.local) && Is.str(bundle.local.dir)) {
      return bundle.local.dir;
    }
  }
}
