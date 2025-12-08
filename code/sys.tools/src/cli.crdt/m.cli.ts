import { type t, Time, Args, c, Cli, Crdt, D, done, Fs, Is, Prompt } from './common.ts';
import { Config } from './u.config.ts';
import { Fmt } from './u.fmt.ts';
import { promptAddDocument, promptRemoveDocument } from './u.prompt.ts';

type C = t.CrdtTool.Command;

const Imports = {
  snapshot: () => import('./cmd.doc.snapshot/mod.ts'),
  docGraph: () => import('./cmd.doc.graph/mod.ts'),
  docGraphLint: () => import('./cmd.doc.graph.lint/mod.ts'),
  docGraphTasks: () => import('./cmds/cmd.doc.graph.tasks.ts'),
  docYamlViewer: () => import('./cmds/cmd.doc.viewer.yaml.ts'),
  daemon: () => import('./cmd.repo.daemon/mod.ts'),
  syncServer: () => import('./cmds/cmd.doc.syncserver.ts'),
  tmp: () => import('./-tmp.ts'),
} as const;

/**
 * Main entry:
 */
export const cli: t.CrdtToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

  /**
   * Check pre-reqs:
   */
  const configpath = Fs.join(cwd, D.Config.filename);
  if (!(await Fs.exists(configpath))) {
    console.info(Fmt.Prereqs.folderNotConfigured(cwd, D.toolname));
    const yes = await Cli.Prompt.Confirm.prompt({ message: `Create config file now?` });
    if (!yes) Deno.exit(0);
  }

  console.info(await Fmt.header(toolname));
  const res = await run(cwd);
  console.info(Fmt.signoff(toolname));

  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir): Promise<t.RunReturn> {
  const config = await Config.get(cwd);
  await Config.normalize(config);

  const Update = {
    async docLastUsedAt(id: t.Crdt.Id) {
      config.change((d) => {
        const entry = Config.findDocEntry(d, id);
        if (entry) entry.lastUsedAt = Time.now.timestamp;
      });
      await config.fs.save();
    },
  } as const;

  const listing = Config.orderByRecency(config.current.docs)
    .map((doc) => ({ doc, name: doc.name ?? '', value: `crdt:${doc.id}` }))
    .map((e, i, total) => {
      const { doc } = e;
      const branch = Fmt.Tree.branch([i, total]);
      const id = `crdt:${doc.id.slice(0, 5)}..${c.green(doc.id.slice(-5))}`;
      let name = `${' with:'} ${branch} ${id}`;
      if (doc.name) name += `  •  ${doc.name}`;
      return { name, value: e.value };
    });

  const opt = (name: string, value: C) => ({ name, value });

  /** --------------------------------------------------------
   * Root Menu
   */
  {
    console.info();
    const defaultCommand = listing.length > 0 ? listing[0].value : ('doc:add' satisfies C);
    const A = (await Prompt.Select.prompt<C>({
      message: 'Tools:\n',
      options: [
        opt('  add: <document>', 'doc:add'),
        ...listing,
        opt(' start: sync server (websockets)', 'repo:syncserver:start'),
        opt(' start: repository daemon', 'repo:daemon:start'),
        opt(c.gray('(exit)'), 'exit'),
      ],
      default: defaultCommand as C,
      hideDefault: true,
    })) as C;

    let id = Crdt.Is.uri(A) ? Crdt.Id.fromUri(A) || '' : '';
    if (id) await Update.docLastUsedAt(id);

    if (A === 'doc:add') {
      const res = await promptAddDocument(cwd);
      if (!res?.id) return done();
      id = res.id;
    }

    if (A === 'exit') return done(0);

    /** --------------------------------------------------------
     * Document Menu
     */
    {
      const { makeHookTmpl } = await Imports.docGraph();
      const hookTmpl = await makeHookTmpl(cwd);

      if (A.startsWith('crdt:')) {
        const options = [
          { name: '  🐷', value: 'doc:graph:dag' },
          opt('  Lint', 'doc:graph:lint'),
          opt('  Tasks', 'doc:graph:tasks'),
          opt('  Snapshot (Backup)', 'snapshot'),
          opt('  Document Graph → DAG (hook)', 'doc:graph:dag'),
          opt('  Document Graph → Walk → Stats', 'doc:graph:walk'),
          opt('  View Yaml', 'doc:viewer:yaml'),
          opt('  View Config', 'doc:config:print'),
        ];

        if (!hookTmpl.exists) {
          options.push(opt(`  Generate ${c.cyan(D.Hook.filename)} file`, 'doc:tmpl:hookfile'));
        }

        options.push(...[opt(c.gray(c.dim(' (forget)')), 'doc:remove')]);

        const B = (await Prompt.Select.prompt<t.CrdtTool.Command>({
          message: `with ${c.gray(`crdt:${id.slice(0, -5)}${c.green(id.slice(-5))}`)}:`,
          options,
        })) as t.CrdtTool.Command;

        if (B === 'snapshot') {
          const m = await Imports.snapshot();
          await m.snapshotCommand(cwd, id);
          return done(0);
        }

        /**
         * TODO 🐷 - make path configurable (via prompt)
         */
        const yamlPath = ['slug'];

        if (B.startsWith('doc:graph')) {
          const m = await Imports.docGraph();

          if (B === 'doc:graph:walk') {
            await m.walkDocumentGraphCommand(cwd, id, yamlPath);
            return done(0);
          }

          if (B === 'doc:graph:dag') {
            await m.dagHookCommand(cwd, id, yamlPath);
            return done(0);
          }
        }

        if (B === 'doc:viewer:yaml') {
          const m = await Imports.docYamlViewer();
          await m.startYamlViewerCommand(cwd, id, yamlPath);
          return done(0);
        }

        if (B === 'doc:graph:lint') {
          const m = await Imports.docGraphLint();
          await m.lintDocumentGraphCommand(cwd, id, yamlPath);
          return done(0);
        }

        if (B === 'doc:graph:tasks') {
          const m = await Imports.docGraphTasks();
          await m.documentGraphTasksCommand(cwd, id, yamlPath);
          return done(0);
        }

        if (B === 'doc:config:print') {
          console.info(Fmt.printDocConfig(config.current, id));
          return done(0);
        }

        if (B === 'doc:tmpl:hookfile') {
          await hookTmpl.write();
          return done(0);
        }

        if (B === 'doc:remove') {
          await promptRemoveDocument(cwd, id);
          return done(0);
        }

        if (B === 'tmp:🐷') {
          const m = await Imports.tmp();
          await m.tmp(cwd, id);
          return done(0);
        }

        if (B === 'exit') return done(0);
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
