import { Args, c, Cli, Crdt, D, done, Fs, Is, type t, Time } from './common.ts';
import { Config } from './u.config.ts';
import { CrdtDocsFs, CrdtDocsMigrate, selectDocumentMenu } from './u.docs/mod.ts';
import { CrdtReposMigrate, promptRepoSyncMenu } from './u.repos/mod.ts';
import { Fmt } from './u.fmt.ts';
import { promptRemoveDocument, promptRenameDocument } from './u.prompt.ts';

type C = t.CrdtTool.Command;
type MenuAction = t.CrdtTool.Command | `plugin:${string}` | 'docs' | 'repo';

const Imports = {
  snapshot: () => import('./cmd.doc.snapshot/mod.ts'),
  docGraph: () => import('./cmd.doc.graph/mod.ts'),
  docYamlViewer: () => import('./cmds/cmd.doc.viewer.yaml.ts'),
  daemon: () => import('./cmd.repo.daemon/mod.ts'),
  syncServer: () => import('./cmds/cmd.doc.syncserver.ts'),
  // tmp: () => import('./-tmp/-tmp.ts'),
  // tmp: () => import('./-tmp/-tmp.gpt.ts'),
} as const;

/**
 * Main entry:
 */
export const cli: t.CrdtToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

  /* Pre-reqs */
  await Config.ensureFile(cwd, D.Config.filename);

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = await run(cwd);
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir): Promise<t.RunReturn> {
  const config = await Config.get(cwd);
  await Config.normalize(config);
  await CrdtDocsMigrate.run(cwd);
  await CrdtReposMigrate.run(cwd);

  const opt = (name: string, value: C) => ({ name, value }) as const;
  const optMenu = (name: string, value: MenuAction) => ({ name, value }) as const;

  /** --------------------------------------------------------
   * Root Menu
   */
  let reopenDocsMenu = false;
  rootLoop: while (true) {
    console.info();
    const totalDocs = (await CrdtDocsFs.list(cwd)).length;
    const docsSuffix = totalDocs > 0 ? ` ${c.gray(`(${totalDocs})`)}` : '';
    let A: MenuAction | undefined;

    if (reopenDocsMenu) {
      const picked = await selectDocumentMenu(cwd);
      if (picked.kind === 'exit') {
        reopenDocsMenu = false;
        continue;
      }
      await ensureDocConfigEntry(cwd, picked.doc);
      A = Crdt.Id.toUri(picked.doc.id) as MenuAction;
      reopenDocsMenu = false;
    } else {
      A = (await Cli.Input.Select.prompt<MenuAction>({
        message: 'crdt:',
        options: [
          optMenu(` documents${docsSuffix}`, 'docs'),
          optMenu(' repo', 'repo'),
          opt(' start: sync server (websockets)', 'repo:syncserver:start'),
          opt(' start: repository daemon', 'repo:daemon:start'),
          opt(c.gray('(exit)'), 'exit'),
        ],
        hideDefault: true,
        maxRows: 25,
      })) as MenuAction;

      if (A === 'exit') return done(0);
      if (A === 'docs') {
        reopenDocsMenu = true;
        continue;
      }
      if (A === 'repo') {
        await promptRepoSyncMenu(cwd);
        continue;
      }
    }

    /** --------------------------------------------------------
     * Document Menu
     */
    {
      const { makeHookTmpl } = await Imports.docGraph();
      const hookTmpl = await makeHookTmpl(cwd);

      if (A.startsWith('crdt:')) {
        const docid = Crdt.Id.fromUri(A);
        if (!docid) continue;
        const arrow = c.gray('→');
        let lastMenuAction: MenuAction | undefined;
        while (true) {
          const { loadDocumentHook } = await Imports.docGraph();
          const hookModule = await loadDocumentHook(cwd);
          const plugins = hookModule?.plugins ?? [];
          const pluginOptions = plugins.map((plugin) => {
            const label = plugin.title ?? plugin.id;
            return optMenu(`  ${label}`, `plugin:${plugin.id}`);
          });
          const options = [
            ...pluginOptions,
            optMenu(`  doc:graph:walk   ${arrow} ${c.cyan(D.Hook.filename)}`, `doc:graph:dag`),
            optMenu(`  doc:graph:walk   ${arrow} stats`, `doc:graph:walk`),
            optMenu(`  doc:graph:backup ${arrow} snapshot`, `snapshot`),
            optMenu(`  view: <yaml>`, `doc:viewer:yaml`),
            optMenu(`  rename`, `doc:rename`),
            // opt(`  🐷 ${c.yellow(c.italic('chat with slug'))}`, 'tmp:🐷'),
          ];

          if (!hookTmpl.exists) {
            options.push(opt(`  Generate ${c.cyan(D.Hook.filename)} file`, 'doc:tmpl:hookfile'));
          }

          options.push(...[optMenu(c.gray(c.dim('  forget')), 'doc:remove')]);
          options.push(optMenu(c.gray(c.dim('← back')), 'back'));

          const B = (await Cli.Input.Select.prompt<MenuAction>({
            message: `with ${c.gray(docid)}:`,
            options,
            default: lastMenuAction,
            hideDefault: true,
            maxRows: 25,
          })) as MenuAction;
          lastMenuAction = B;

          if (B === 'back') {
            reopenDocsMenu = true;
            continue rootLoop;
          }

          if (B === 'snapshot') {
            const m = await Imports.snapshot();
            await m.snapshotCommand(cwd, docid);
            continue;
          }

          /**
           * TODO 🐷 - make path configurable (via prompt)
           */
          const yamlPath = ['slug'];

          if (B.startsWith('doc:graph')) {
            const m = await Imports.docGraph();

            if (B === 'doc:graph:walk') {
              await m.walkDocumentGraphCommand(cwd, docid, yamlPath);
              continue;
            }

            if (B === 'doc:graph:dag') {
              await m.dagHookCommand(cwd, docid, yamlPath);
              continue;
            }
          }

          if (B.startsWith('plugin:')) {
            const id = B.slice('plugin:'.length);
            const plugin = plugins.find((entry) => entry.id === id);
            if (!plugin) return done(0);

            const { buildDocumentDAG } = await Imports.docGraph();
            const { RepoProcess } = await Imports.daemon();
            const port = D.port.repo;
            const cmd = await RepoProcess.tryClient(port);
            if (!cmd) return done(0);

            const dag = await buildDocumentDAG(cmd, docid, yamlPath);
            const result = await plugin.run({ dag, cwd, cmd, docpath: yamlPath });
            const kind = wrangle.pluginResult(result);
            if (kind === 'exit') return done(0);
            if (kind === 'back') {
              reopenDocsMenu = true;
              continue rootLoop;
            }
            continue;
          }

          if (B === 'doc:viewer:yaml') {
            const m = await Imports.docYamlViewer();
            await m.startYamlViewerCommand(cwd, docid, yamlPath);
            continue;
          }

          if (B === 'doc:rename') {
            await promptRenameDocument(cwd, docid);
            continue;
          }

          if (B === 'doc:tmpl:hookfile') {
            await hookTmpl.write();
            return done(0);
          }

          if (B === 'doc:remove') {
            await promptRemoveDocument(cwd, docid);
            reopenDocsMenu = true;
            continue rootLoop;
          }

          if (B === 'exit') return done(0);
        }
      }
    }

    /** --------------------------------------------------------
     * Daemons/Services
     */
    {
      if (A === 'repo:daemon:start') {
        const m = await Imports.daemon();
        await m.RepoProcess.daemon(cwd);
      }

      if (A === 'repo:syncserver:start') {
        const { startSyncServerCommand } = await Imports.syncServer();
        await startSyncServerCommand(cwd);
      }
    }
  }

  // End.
  return done(0);
}

const wrangle = {
  pluginResult(result: t.DocumentGraphPluginResult): t.DocumentGraphPluginResultKind {
    if (Is.str(result)) return result;
    if (result && Is.str(result.kind)) return result.kind;
    return 'stay';
  },
} as const;

async function ensureDocConfigEntry(cwd: t.StringDir, doc: t.CrdtTool.DocumentYaml.Doc) {
  const config = await Config.get(cwd);
  const exists = (config.current.docs ?? []).some((d) => d.id === doc.id);
  if (exists) return;
  const createdAt = Time.now.timestamp;
  const entry: t.CrdtTool.Config.DocumentEntry = { id: doc.id, name: doc.name, createdAt };
  config.change((d) => (d.docs || (d.docs = [])).push(entry));
  await config.fs.save();
}
