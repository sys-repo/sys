import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, AliasResolver, c, Cli, D, Fs, Is } from '../common.ts';
import { makeResolvers } from './u.resolve.ts';

type O = Record<string, unknown>;

export async function lintDocumentGraphCommand(
  cwd: t.StringDir,
  docid: t.Crdt.Id,
  yamlPath: t.ObjectPath,
) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const dag = await buildDocumentDAG(cmd, docid, yamlPath);
  const { Lens, Resolve } = makeResolvers(yamlPath);

  // Derive root-level :index alias resolver (for second-hop resolution).
  const root = dag.nodes[0];
  const rootSlug = Resolve.slug(root);
  const rootAlias = rootSlug ? Lens.alias.get(rootSlug) : undefined;
  const rootIndexAnalysis = Is.record(rootAlias) ? AliasResolver.analyze(rootAlias) : undefined;
  const indexResolver = rootIndexAnalysis?.resolver;

  type TFile = { path: string; exists: boolean };
  const files: TFile[] = [];
  const addFile = async (path: string) => {
    path = Fs.Tilde.expand(path);
    const exists = await Fs.exists(path);
    files.push({ exists, path });
  };

  for (const node of dag.nodes.filter((node) => !!node.doc?.current)) {
    const { alias, sequence } = Resolve.slugParts(node);
    if (!alias) continue;
    if (!Array.isArray(sequence)) continue;

    for (const item of sequence) {
      const localResolver = AliasResolver.analyze(alias).resolver;

      const res = await Resolve.path(item.video, localResolver, indexResolver);
      if (!res) continue;
      await addFile(res.value);

      if (Is.record(item.timestamps)) {
        for (const [timestamp, obj] of Object.entries(item.timestamps)) {
          if (!Is.record(obj)) continue;
          if (Is.str(obj.image)) {
            const res = await Resolve.path(obj.image, localResolver, indexResolver);
            if (res) await addFile(res?.value);
          }
        }
      }
    }
  }

  /**
   * Write bundle to disk.
   */
  const outDir = Fs.join(cwd, 'bundle.assets');
  await Fs.writeJson(Fs.join(outDir, '-manifest.json'), { files });

  const spinner = Cli.spinner();
  const baseDir = Fs.Tilde.expand((rootAlias as O)[':assets'] as string);

  for (const item of files.filter((m) => m.exists)) {
    const target = Fs.join(outDir, item.path.slice(baseDir.length));
    await Fs.copy(item.path, target);
  }

  spinner.stop();

  files
    .filter((m) => !m.exists)
    .forEach((m) => {
      const path = `${Fs.dirname(m.path)}/${c.cyan(Fs.basename(m.path))}`;
      console.info(c.gray(`${c.yellow('Not found:')} ${path}`));
    });

  console.info('rootAlias', rootAlias);
  console.info();
  console.info('✨ DONE! - 👋 Hello Rowan 🌈🦄 ');
  console.info(c.italic(c.yellow('   Now zip folder and copy to Phil in Telegram')));
  console.info(c.gray(`   ${outDir}`));
  console.info();
}
