import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import {
  type t,
  Hash,
  Fs,
  AliasResolver,
  c,
  Cli,
  D,
  Graph,
  Is,
  Obj,
  Str,
  Yaml,
} from '../common.ts';
import { Fmt } from '../u.fmt.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

// 🌸🌸 ---------- ADDED: doc-lint-normalize-index-fs-path ----------
function normalizeIndexFsPath(value: string): string {
  /**
   * CLI-only normalization for filesystem-ish paths:
   * - strip leading "/crdt:<id>/alias/" prefix if present
   * - collapse repeated "/" into a single "/"
   * - if the result is "/~/foo/..." (tilde path from alias),
   *   drop the leading "/" → "~/foo/..."
   */
  const withoutIndexPrefix = value.replace(/^\/?crdt:[^/]+\/alias\//, '/');
  const collapsed = withoutIndexPrefix.replace(/\/+/g, '/');

  // Preserve user-authored tilde paths (e.g. "~/Documents/...").
  if (collapsed.startsWith('/~/')) return collapsed.slice(1);

  return collapsed;
}
// 🌸 ---------- /ADDED ----------

export async function lintDocumentGraph(cwd: t.StringDir, docid: t.Crdt.Id, path: t.ObjectPath) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  let _total = 0;

  // 🌸🌸 ---------- REFACTORED: doc-lint-video-lint-buffer ----------
  const _videoLint: {
    readonly nodeId: string;
    readonly videoRaw: string;
    readonly resolvedPath: string;
    readonly hops: number;
    readonly fullyResolved: boolean;
    readonly remainingTokens: readonly string[];
    readonly hasIndexAliasPrefix: boolean;
  }[] = [];
  // 🌸 ---------- /REFACTORED ----------

  const dag = await buildDocumentDAG(cmd, docid, path);
  const Lens = {
    yaml: Obj.Lens.at(path),
    alias: Obj.Lens.at<O>(['alias']),
    sequence: Obj.Lens.at<O>(['data', 'sequence']),
  };

  const Resolve = {
    slug(node: N) {
      const yaml = Lens.yaml.get(node.doc?.current);
      if (!Is.str(yaml)) return;
      const slug = Yaml.parse<O>(yaml).data;
      return Is.record(slug) ? slug : undefined;
    },
    slugParts(node: N) {
      const slug = Resolve.slug(node);
      const alias = slug ? Lens.alias.get(slug) : undefined;
      const sequence = slug ? Lens.sequence.get(slug) : undefined;
      return { alias, sequence };
    },
  } as const;

  const root = dag.nodes[0];
  const rootAlias = Resolve.slugParts(root).alias;

  // 🌸🌸 ---------- ADDED: doc-lint-root-assets-path ----------
  const rootAssetsPath =
    Is.record(rootAlias) && Is.str((rootAlias as O)[':assets'])
      ? String((rootAlias as O)[':assets'])
      : undefined;
  // 🌸 ---------- /ADDED ----------

  // 🌸🌸 ---------- REFACTORED: doc-lint-alias-expand-chain ----------
  /**
   * Optional “index” alias resolver derived from the root document.
   * If the root has a top-level alias table, we treat that as a second hop.
   */
  const indexAnalysis = Is.record(rootAlias) ? AliasResolver.analyze(rootAlias) : null;
  const indexResolver = indexAnalysis?.resolver;

  /**
   * For video → filesystem paths, the index key we care about is ":assets".
   * Keys like ":core" / ":p2p" point to YAML paths, not files.
   */
  const ASSETS_KEY: t.Alias.Key = ':assets';
  const indexHasAssets = !!(indexResolver && indexResolver.alias[ASSETS_KEY]);

  /**
   * Walk each document in the DAG:
   * - find its `slug.data.alias` table (if any)
   * - analyze the table (normalize + diagnostics)
   * - optionally expand `sequence[].video` using local + index alias tables
   */
  await Graph.Dag.forEachAsync(dag, async (node) => {
    const { alias, sequence } = Resolve.slugParts(node);
    if (!Is.record(alias)) return;
    _total++;

    // 1) Analyze the local alias table.
    const { resolver: localResolver, diagnostics } = AliasResolver.analyze(alias);
    const localMap = localResolver.alias;

    // TODO: pipe diagnostics into a structured lint report / markers.
    if (diagnostics.length > 0) {
      for (const d of diagnostics) {
        // d.kind, d.path, d.key, d.value, d.message
      }
    }

    // 2) Self-check each alias value by expanding within the local table.
    for (const [key, raw] of Object.entries(localMap)) {
      if (raw == null) continue;
      const { value, remaining } = AliasResolver.expand(raw, localMap);
      const fullyResolved = remaining.length === 0;
      // TODO: record (key, raw, value, fullyResolved) as part of the lint output.
      void value;
      void fullyResolved;
      void key;
      void remaining;
    }

    /**
     * 3) Helper: expand a path using local aliases, optionally
     *    chaining into the index resolver when ":assets" remains.
     */
    const expandVideoPath = async (raw: unknown) => {
      if (typeof raw !== 'string') return undefined;

      // No index table → single-table expansion.
      if (!indexResolver || !indexHasAssets) {
        return AliasResolver.expand(raw, localMap);
      }

      const chain = await AliasResolver.expandChain(raw, localResolver, {
        async loadNext({ step }) {
          const hasAssetsToken = step.remaining.includes(ASSETS_KEY);
          return hasAssetsToken ? indexResolver : null;
        },
      });

      return chain;
    };

    type TSeq = { video?: t.StringPath; slice?: t.Timecode.SliceString; timestamps?: unknown[] };
    const seqItems = (Is.array(sequence) ? sequence : []).filter(Is.record) as TSeq[];

    // 4) Expand any sequence video paths using the helper above.
    for (const item of seqItems) {
      const { video, slice, timestamps } = item;
      if (!video) continue;

      const expanded = await expandVideoPath(video);
      if (!expanded) continue;

      const rawExpanded = expanded.value;
      const normalizedFsPath = normalizeIndexFsPath(rawExpanded);

      // Derive resolution metadata from the expanded result.
      const steps = Is.array((expanded as any).steps)
        ? ((expanded as any).steps as readonly unknown[])
        : undefined;
      const hops = steps ? steps.length : 1;

      const remainingTokens = Is.array((expanded as any).remaining)
        ? ((expanded as any).remaining as string[])
        : [];

      const hasIndexAliasPrefix = /\/:index\/alias\//.test(rawExpanded);

      const fullyResolved = remainingTokens.length === 0 && !hasIndexAliasPrefix;

      // 🌸🌸 ---------- ADDED: doc-lint-video-lint-collect ----------
      _videoLint.push({
        nodeId: node.id,
        videoRaw: video,
        resolvedPath: normalizedFsPath,
        hops,
        fullyResolved,
        remainingTokens,
        hasIndexAliasPrefix,
      });
      void slice;
      void timestamps;
      // 🌸 ---------- /ADDED ----------
    }
  });
  // 🌸 ---------- /REFACTORED ----------

  const table = Cli.table();
  table.push([c.bold(c.cyan('Lint'))]);
  table.push([c.gray('  root document:'), Fmt.prettyUri(docid)]);
  table.push([c.gray(`  yaml path:`), path ? `/${path.join('/')}` : '-']);
  table.push([
    c.gray(`  graph:`),
    `${_total} ${c.gray(Str.plural(_total, 'document', 'documents'))}`,
  ]);

  console.info(String(table));
  console.info();

  function expandTilde(path: string): string {
    const home = Deno.env.get('HOME');
    if (!home) return path;

    // "~" → "/Users/phil"
    if (path === '~') return home;

    // "~/foo/bar" → "/Users/phil/foo/bar"
    if (path.startsWith('~/')) return `${home}/${path.slice(2)}`;

    return path;
  }

  // 🌸🌸 ---------- ADDED: doc-lint-video-lint-print ----------
  if (_videoLint.length > 0) {
    for (const row of _videoLint) {
      const pathOut = row.resolvedPath;
      const status = row.fullyResolved ? c.green('✔') : c.yellow('~');
      const suffix =
        !row.fullyResolved && row.remainingTokens.length > 0
          ? `  remaining: [${row.remainingTokens.join(', ')}]`
          : row.hasIndexAliasPrefix
            ? '  (has :index/alias prefix)'
            : '';

      // Optional existence check (kept silent for now).
      if (row.fullyResolved) {
        const filePath = expandTilde(pathOut);
        const exists = await Fs.exists(filePath);
        // console.log('exists', exists, path);
        if (!exists) {
          // const noise = crypto.randomUUID() + '\n' + Math.random();
          // await Fs.write(path, new TextEncoder().encode(noise));
        }
        if (exists && rootAssetsPath) {
          // console.log('rootAssetsPath', rootAssetsPath);
          const assetsDir = Fs.resolve(expandTilde(rootAssetsPath), '..', 'publish.assets') ?? '';
          // console.log('assetsDir', assetsDir);
          await Fs.ensureDir(assetsDir);

          const file = (await Fs.read(filePath)).data;
          if (file && assetsDir) {
            const hashFilename = Hash.sha256(file);
            const hashPath = `${Fs.join(assetsDir, hashFilename)}${Fs.extname(filePath)}`;
            await Fs.write(hashPath, file);
          }
        }
      } else {
        console.warn(c.yellow(`🫵  Path contains errors: `), pathOut);
      }
    }
  }

  // Print the root-level :assets path after all resolved paths.
  // This is the canonical “base” folder the videos should live under.
  if (rootAssetsPath) {
    console.info();
    console.log('assets', c.gray(c.cyan(rootAssetsPath)));
  }
  // 🌸 ---------- /ADDED ----------

  void cwd;
  void rootAlias;
}
