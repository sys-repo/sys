import { type t, Crdt, Fs, Is, Obj, Yaml } from './common.ts';

export async function bundleSlugDocYaml(args: {
  cwd: t.StringDir;
  dag: t.Graph.Dag.Result;
  yamlPath: t.ObjectPath;
  config: t.SlugBundleDocYaml;
}) {
  const outDir = resolveDir(args.cwd, args.config.target.dir);
  await Fs.ensureDir(outDir);

  const written: t.StringFile[] = [];

  for (const node of args.dag.nodes) {
    const raw = resolveRawYaml(node.doc?.current, args.yamlPath);
    if (typeof raw !== 'string' || raw.trim().length === 0) continue;

    const parsed = Yaml.parse<unknown>(raw);
    const text = Yaml.stringify(parsed.data).data;
    if (typeof text !== 'string' || text.trim().length === 0) continue;

    const filename = resolveFilename(node.id as t.Crdt.Id, args.config);
    const path = Fs.join(outDir, filename) as t.StringFile;
    await Fs.write(path, text.endsWith('\n') ? text : `${text}\n`);
    written.push(path);
  }

  return {
    dir: outDir,
    written,
  } as const satisfies t.BundleSlugDocYamlResult;
}

function resolveRawYaml(input: unknown, yamlPath: t.ObjectPath): string | undefined {
  if (typeof input === 'string') return input;
  if (!Array.isArray(yamlPath) || yamlPath.length === 0) return undefined;
  if (!Is.record(input)) return undefined;
  const raw = Obj.Lens.at<string>(yamlPath).get(input);
  return typeof raw === 'string' ? raw : undefined;
}

function resolveDir(cwd: t.StringDir, dir: t.StringDir): t.StringDir {
  if (Fs.Path.Is.absolute(dir)) return dir;
  return Fs.resolve(cwd, String(dir), { expandTilde: true }) as t.StringDir;
}

function resolveFilename(docid: t.Crdt.Id, config: t.SlugBundleDocYaml): t.StringFile {
  const mode = config.target.filenames?.mode ?? 'docid';
  const clean = Crdt.Id.clean(String(docid)) ?? String(docid).replaceAll(':', '-');
  if (mode === 'docid') return `slug.${clean}.yaml` as t.StringFile;
  return `slug.${clean}.yaml` as t.StringFile;
}
