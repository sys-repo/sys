import { type t, Fs, Is, SlugBundle, SlugTree, Yaml } from './common.ts';
import { SlugSchema } from '@sys/model-slug/schema';
import { prepareTarget, refreshMount, refreshStagedRoot, writeDerivedManifestOutputs, writeTreeFsDerivedOutputs, writeTreeMountOutputs } from './u.stage.shared.ts';

type RootMeta = {
  readonly root?: {
    readonly docid?: string;
    readonly file?: string;
  };
};

type AuthoredDoc = {
  readonly docid: t.StringId;
  readonly file: t.StringFile;
  readonly rel: t.StringPath;
  readonly source: string;
  readonly slug: Record<string, unknown>;
};

type AuthoredDataset = {
  readonly rootDocid: t.StringId;
  readonly root: AuthoredDoc;
  readonly docs: readonly AuthoredDoc[];
  readonly dag: t.SlugBundleTransform.Dag.Shape;
};

type RootTreeExport = {
  readonly mount: t.StringId;
  readonly tree: t.SlugTreeDoc;
};

const YAML_PATH = [] as unknown as t.ObjectPath;

export const stageSlugDataset: t.SlugDataPipeline.StageSlugDataset.Run = async (args) => {
  const source = String(args.source).trim();
  const root = String(args.root).trim();
  if (!source) throw new Error('stageSlugDataset: source is required');
  if (!root) throw new Error('stageSlugDataset: root is required');

  const sourceInfo = await Fs.stat(source);
  if (!sourceInfo || !sourceInfo.isDirectory) {
    throw new Error(`stageSlugDataset: source directory not found: ${source}`);
  }

  const dataset = await readAuthoredDataset(source as t.StringDir);
  const requested = new Set((args.mounts ?? []).map((value) => String(value).trim()).filter(Boolean));
  const mounts = resolveRootTreeExports(dataset.root.slug, requested);
  if (mounts.length === 0) {
    throw new Error(`stageSlugDataset: no slug-tree mounts found in ${dataset.root.file}`);
  }
  const progress = args.progress;
  const derivedDocs = dataset.docs.filter((doc) => doc.docid !== dataset.rootDocid);

  const dirs: t.StringDir[] = [];
  const stagedMounts: t.StringId[] = [];

  for (const [mountIndex, item] of mounts.entries()) {
    progress?.({
      stage: 'mount',
      current: mountIndex + 1,
      total: mounts.length,
      mount: item.mount,
    });

    const target = Fs.join(root, item.mount) as t.StringDir;
    await prepareTarget(target);

    const treeFiles = await writeTreeMountOutputs({
      target,
      mount: item.mount,
      treeJson: item.tree,
      treeYaml: SlugTree.toYaml(item.tree),
    });

    const content = await deriveSlugDatasetContent({
      dataset,
      mount: item.mount,
      manifests: [treeFiles.manifestJson, treeFiles.manifestYaml],
    });
    if (!content.ok) throw content.error;

    await writeTreeFsDerivedOutputs({
      contentDir: treeFiles.contentDir,
      assetsJson: treeFiles.assetsJson,
      derived: content.value,
    });

    for (const [docIndex, doc] of derivedDocs.entries()) {
      progress?.({
        stage: 'doc',
        current: docIndex + 1,
        total: derivedDocs.length,
        mount: item.mount,
        docid: doc.docid,
      });
      const derived = await SlugBundle.Transform.derive({
        dag: dataset.dag,
        yamlPath: YAML_PATH,
        docid: toCrdtId(doc.docid),
        target: {
          manifests: {
            base: target,
            dir: 'manifests',
            tree: 'slug.<docid>.tree.json',
          },
        },
      });
      if (!derived.ok) throw derived.error;
      await writeDerivedManifestOutputs({ manifestsDir: treeFiles.manifestsDir, derived: derived.value });
    }

    await refreshMount(target);
    dirs.push(target);
    stagedMounts.push(item.mount);
  }

  const refreshed = await refreshStagedRoot(root as t.StringDir);

  return {
    ok: true,
    kind: 'stage-slug-dataset',
    source: source as t.StringDir,
    root: root as t.StringDir,
    dirs,
    mounts: stagedMounts,
    mountsPath: refreshed.mountsPath,
    distPath: refreshed.distPath,
  };
};

async function readAuthoredDataset(source: t.StringDir): Promise<AuthoredDataset> {
  const metaPath = Fs.join(source, '-root.yaml');
  const docsDir = Fs.join(source, 'docs') as t.StringDir;
  if (!(await Fs.exists(metaPath))) throw new Error(`stageSlugDataset: missing -root.yaml in ${source}`);
  if (!(await Fs.exists(docsDir))) throw new Error(`stageSlugDataset: missing docs directory in ${source}`);

  const metaRaw = String((await Fs.readText(metaPath)).data ?? '');
  const meta = (Yaml.parse<RootMeta>(metaRaw).data ?? {}) as RootMeta;
  const rootDocidRaw = String(meta.root?.docid ?? '').trim();
  if (!rootDocidRaw) throw new Error(`stageSlugDataset: missing root.docid in ${metaPath}`);

  const paths = await Fs.ls(docsDir, { includeDirs: false, depth: 1 });
  const docs: AuthoredDoc[] = [];
  for (const path of paths) {
    const name = Fs.basename(path);
    const match = name.match(/^slug\.(.+)\.yaml$/);
    if (!match) continue;
    const sourceText = String((await Fs.readText(path)).data ?? '');
    const parsed = Yaml.parse<Record<string, unknown>>(sourceText).data;
    if (!Is.record(parsed)) throw new Error(`stageSlugDataset: invalid yaml doc: ${path}`);
    docs.push({
      docid: match[1] as t.StringId,
      file: path as t.StringFile,
      rel: `docs/${name}` as t.StringPath,
      source: sourceText,
      slug: parsed,
    });
  }

  const rootDocid = rootDocidRaw as t.StringId;
  const root = docs.find((doc) => doc.docid === rootDocid);
  if (!root) throw new Error(`stageSlugDataset: root doc not found in docs/: ${rootDocid}`);

  const dag = {
    nodes: docs.map((doc) => ({ id: toCrdtId(doc.docid), doc: { current: doc.source } })),
  } as const;

  return { rootDocid, root, docs, dag };
}

function resolveRootTreeExports(
  rootSlug: Record<string, unknown>,
  requested: ReadonlySet<string>,
): readonly RootTreeExport[] {
  const traits = Array.isArray(rootSlug.traits) ? rootSlug.traits : [];
  const data = Is.record(rootSlug.data) ? rootSlug.data : {};
  const items: RootTreeExport[] = [];

  for (const trait of traits) {
    if (!Is.record(trait)) continue;
    if (trait.of !== 'slug-tree') continue;
    const as = Is.str(trait.as) ? trait.as.trim() : '';
    if (!as) continue;
    if (requested.size > 0 && !requested.has(as)) continue;
    const payload = data[as];
    if (!Is.record(payload)) throw new Error(`stageSlugDataset: root tree payload missing at data.${as}`);
    const checked = SlugSchema.Tree.validate(payload);
    if (!checked.ok) throw new Error(`stageSlugDataset: invalid root tree at data.${as}: ${checked.error.message}`);
    items.push({ mount: as as t.StringId, tree: checked.sequence });
  }

  return items.sort((a, b) => a.mount.localeCompare(b.mount));
}

async function deriveSlugDatasetContent(args: {
  dataset: AuthoredDataset;
  mount: t.StringId;
  manifests: readonly t.StringPath[];
}) {
  const files = args.dataset.docs.map((doc) => ({
    path: doc.rel,
    source: doc.source,
    name: Fs.basename(doc.file),
  }));
  return await SlugBundle.Transform.TreeFs.derive({
    files,
    includePath: true,
    docid: args.mount,
    manifests: args.manifests,
  });
}

function toCrdtId(docid: t.StringId): t.StringId {
  const raw = String(docid).trim();
  return (raw.startsWith('crdt:') ? raw : `crdt:${raw}`) as t.StringId;
}
