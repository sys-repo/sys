import { Cell, type t } from '@sys/cell';
import { Fs } from '@sys/fs';
import { Is } from '@sys/std/is';
import { Str } from '@sys/std/str';
import { Yaml } from '@sys/yaml';

const root = './-sample/cell.stripe';
const cell = await Cell.load(root);
const runtime = await Cell.Runtime.start(cell, {
  async args({ service, args }) {
    if (service.service.kind !== 'http-static') return args;
    return { ...args, info: await viewUrls(cell, service.service) };
  },
});

await Promise.race(
  runtime.services
    .map((service) => service.started)
    .filter((started): started is { finished: Promise<unknown> } =>
      Is.record(started) && Is.promise(started.finished)
    )
    .map((server) => server.finished),
);

async function viewUrls(
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
  if (!read.ok) throw new Error(`Sample Cell: failed to read pull config: ${configPath}`);

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) throw parsed.error;

  const dir = pullLocalDir(parsed.data);
  if (!dir) throw new Error(`Sample Cell: pull config has no local.dir: ${configPath}`);
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
