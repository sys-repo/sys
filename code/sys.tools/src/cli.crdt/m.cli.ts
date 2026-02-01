import { Args, c, Cli, Crdt, D, done, Fs, Is, type t } from './common.ts';
import { CrdtDocsFs, CrdtDocsMigrate, selectDocumentMenu } from './u.config.docs/mod.ts';
import { CrdtReposFs, CrdtReposMigrate, promptRepoSyncMenu } from './u.config.repo/mod.ts';
import { Fmt } from './u.fmt.ts';
import { createCrdtLog } from './u.log.ts';
import { loadLegacyConfig, removeLegacyConfig } from './u.migrate.legacy.ts';
import { promptRemoveDocument, promptRenameDocument } from './u.prompt.ts';

type C = t.CrdtTool.Command;
type MenuAction =
  | t.CrdtTool.Command
  | `plugin:${string}`
  | `root:plugin:${string}`
  | 'docs'
  | 'repo';

const Imports = {
  snapshot: () => import('./cmd.doc.snapshot/mod.ts'),
  docGraph: () => import('./cmd.doc.graph/mod.ts'),
  rootHook: () => import('./cmd.hook/mod.ts'),
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
  const debug = args.debug === true;
  const log = createCrdtLog({ debug });

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = await run(cwd, { log });
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir, options: { log?: t.Logger }): Promise<t.RunReturn> {
  const legacy = await loadLegacyConfig(cwd);
  await CrdtDocsMigrate.run(cwd, legacy?.doc);
  await CrdtReposMigrate.run(cwd, legacy?.doc);
  if (legacy) await removeLegacyConfig(legacy.path);

  const opt = (name: string, value: C) => ({ name, value }) as const;
  const optMenu = (name: string, value: MenuAction) => ({ name, value }) as const;

  /** --------------------------------------------------------
   * Root Menu
   */
  let reopenDocsMenu = false;
  rootLoop: while (true) {
    const totalDocs = (await CrdtDocsFs.list(cwd)).length;
    const docsSuffix = totalDocs > 0 ? ` ${c.gray(`(${totalDocs})`)}` : '';
    let A: MenuAction | undefined;

    if (reopenDocsMenu) {
      const log = options.log?.sub('docs');
      const picked = await selectDocumentMenu(cwd, { log });
      if (picked.kind === 'exit') {
        reopenDocsMenu = false;
        continue;
      }
      A = Crdt.Id.toUri(picked.doc.id) as MenuAction;
      reopenDocsMenu = false;
    } else {
      const { loadRootHook, makeRootHookTmpl } = await Imports.rootHook();
      const rootHookModule = await loadRootHook(cwd);
      const rootHookTmpl = await makeRootHookTmpl(cwd);
      const rootPlugins = rootHookModule?.plugins ?? [];
      const rootPluginOptions = rootPlugins.map((plugin) => {
        const label = plugin.title ?? plugin.id;
        return optMenu(` - ${label}`, `root:plugin:${plugin.id}`);
      });

      A = (await Cli.Input.Select.prompt<MenuAction>({
        message: '',
        options: [
          ...rootPluginOptions,
          optMenu(` documents${docsSuffix}`, 'docs'),
          optMenu(' repository', 'repo'),
          ...(!rootHookTmpl.exists
            ? [opt(` generate ${c.cyan(D.Hook.filename)} file`, 'root:tmpl:hookfile')]
            : []),
          opt(c.gray('(exit)'), 'exit'),
        ],
        hideDefault: true,
        maxRows: 25,
      })) as MenuAction;

      if (A === 'root:tmpl:hookfile') {
        await rootHookTmpl.write();
        return done(0);
      }
      if (A === 'exit') return done(0);
      if (A === 'docs') {
        reopenDocsMenu = true;
        continue;
      }
      if (A === 'repo') {
        const log = options.log?.sub('repo');
        await promptRepoSyncMenu({
          cwd,
          log,
          onStartSyncServer: async () => {
            const { startSyncServerCommand } = await Imports.syncServer();
            await startSyncServerCommand(cwd);
          },
          onStartDaemon: async () => {
            const m = await Imports.daemon();
            await m.RepoProcess.daemon(cwd);
          },
        });
        continue;
      }

      if (A.startsWith('root:plugin:')) {
        const id = A.slice('root:plugin:'.length);
        const { loadRootHook } = await Imports.rootHook();
        const hookModule = await loadRootHook(cwd);
        const plugins = hookModule?.plugins ?? [];
        const plugin = plugins.find((entry) => entry.id === id);
        if (!plugin) continue;

        const { RepoProcess } = await Imports.daemon();
        const ports = await CrdtReposFs.loadPorts(cwd);
        const cmd = await RepoProcess.tryClient(ports.repo);

        if (!cmd) {
          const repoAction = await promptRepoSyncMenu({
            cwd,
            log: options.log?.sub('repo'),
            onStartSyncServer: async () => {
              const { startSyncServerCommand } = await Imports.syncServer();
              await startSyncServerCommand(cwd);
            },
            onStartDaemon: async () => {
              const m = await Imports.daemon();
              await m.RepoProcess.daemon(cwd);
            },
          });
          if (repoAction === 'back') continue;
          continue;
        }

        const result = await plugin.run({ cwd, cmd });
        const kind = wrangle.rootPluginResult(result);
        if (kind === 'exit') return done(0);
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
            return optMenu(`  - ${label}`, `plugin:${plugin.id}`);
          });
          const { RepoProcess } = await Imports.daemon();
          const ports = await CrdtReposFs.loadPorts(cwd);
          const cmd = await RepoProcess.tryClient(ports.repo);

          if (!cmd) {
            const repoAction = await promptRepoSyncMenu({
              cwd,
              log: options.log?.sub('repo'),
              onStartSyncServer: async () => {
                const { startSyncServerCommand } = await Imports.syncServer();
                await startSyncServerCommand(cwd);
              },
              onStartDaemon: async () => {
                const m = await Imports.daemon();
                await m.RepoProcess.daemon(cwd);
              },
            });
            if (repoAction === 'back') {
              reopenDocsMenu = true;
              continue rootLoop;
            }
            continue;
          }

          const menuOptions: Array<{ name: string; value: MenuAction }> = [
            ...pluginOptions,
            optMenu(`  doc:graph:walk   ${arrow} ${c.cyan(D.Hook.Doc.filename)}`, `doc:graph:dag`),
            optMenu(`  doc:graph:walk   ${arrow} stats`, `doc:graph:walk`),
            optMenu(`  doc:graph:backup ${arrow} snapshot`, `snapshot`),
            optMenu(`  view: <yaml>`, `doc:viewer:yaml`),
            optMenu(`  rename`, `doc:rename`),
            // opt(`  🐷 ${c.yellow(c.italic('chat with slug'))}`, 'tmp:🐷'),
          ];

          if (!hookTmpl.exists) {
            menuOptions.push(
              opt(`  Generate ${c.cyan(D.Hook.Doc.filename)} file`, 'doc:tmpl:hookfile'),
            );
          }

          menuOptions.push(...[optMenu(c.gray(c.dim('  forget')), 'doc:remove')]);
          menuOptions.push(optMenu(c.gray(c.dim('← back')), 'back'));

          const B = (await Cli.Input.Select.prompt<MenuAction>({
            message: `with ${c.gray(docid)}:`,
            options: menuOptions,
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
            if (!cmd) continue;

            const { buildDocumentDAG } = await Imports.docGraph();
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

          if (B === 'repo:daemon:start') {
            const m = await Imports.daemon();
            await m.RepoProcess.daemon(cwd);
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
  rootPluginResult(result: t.RootHookPluginResult): t.RootHookPluginResultKind {
    if (Is.str(result)) return result;
    if (result && Is.str(result.kind)) return result.kind;
    return 'stay';
  },
} as const;
