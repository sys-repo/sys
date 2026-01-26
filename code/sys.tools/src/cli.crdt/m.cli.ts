import { Args, c, Cli, Crdt, D, done, Fs, Is, type t, Time } from './common.ts';
import { Config } from './u.config.ts';
import { Fmt } from './u.fmt.ts';
import { promptRemoveDocument } from './u.prompt.ts';

type C = t.CrdtTool.Command;

const Imports = {
  snapshot: () => import('./cmd.doc.snapshot/mod.ts'),
  docGraph: () => import('./cmd.doc.graph/mod.ts'),
  docGraphLint: () => import('./cmd.doc.graph.lint/mod.ts'),
  docGraphTasks: () => import('./cmds/cmd.doc.graph.tasks.ts'),
  indexDocument: () => import('./cmd.doc.index/mod.ts'),
  addOrCreateDocument: () => import('./cmds/cmd.doc.add.ts'),
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
    .map((doc) => ({ doc, name: doc.name ?? '', value: Crdt.Id.toUri(doc.id) }))
    .map((e, i, total) => {
      const { doc } = e;
      const branch = Fmt.Tree.branch([i, total]);
      const id = `crdt:${doc.id.slice(0, 5)}..${c.green(doc.id.slice(-5))}`;
      let name = `${' with:'} ${branch} ${id}`;
      if (doc.name) name += `  •  ${doc.name}`;
      return { name, value: e.value };
    });

  const opt = (name: string, value: C) => ({ name, value }) as const;

  /** --------------------------------------------------------
   * Root Menu
   */
  while (true) {
    console.info();
    const defaultCommand = listing.length > 0 ? listing[0].value : ('doc:add' satisfies C);
    let A = (await Cli.Input.Select.prompt<C>({
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
      maxRows: 25,
    })) as C;

    let docid = Crdt.Is.uri(A) ? Crdt.Id.fromUri(A) || '' : '';
    if (docid) await Update.docLastUsedAt(docid);

    if (A === 'doc:add') {
      const m = await Imports.addOrCreateDocument();
      const res = await m.addOrCreateDocument(cwd);
      if (!res) return done();
      if (res.created) console.info(c.gray(`created document: ${c.white(Fmt.prettyUri(res.id))}`));
      docid = res.id;
      if (docid) await Update.docLastUsedAt(docid);
      A = Crdt.Id.toUri(docid) as C;
    }

    if (A === 'exit') return done(0);

    /** --------------------------------------------------------
     * Document Menu
     */
    {
      const { makeHookTmpl } = await Imports.docGraph();
      const hookTmpl = await makeHookTmpl(cwd);

      if (A.startsWith('crdt:')) {
        while (true) {
          const lintModule = c.dim(`[ ${c.cyan(`:plugin:program:${c.yellow('slugs')}`)} ]`);
          const options = [
            opt(`  lint ${lintModule}`, `doc:graph:lint`),
            opt(`  doc:indexer:fs`, 'doc:indexer:fs'),
            opt(`  doc:graph:backup (snapshot)`, `snapshot`),
            opt(`  doc:graph: walk → ${c.cyan(D.Hook.filename)}`, `doc:graph:dag`),
            opt(`  doc:graph: walk → stats`, `doc:graph:walk`),
            opt(`  doc:graph: tasks`, `doc:graph:tasks`),
            opt(`  view: <yaml>`, `doc:viewer:yaml`),
            opt(`  view: ${c.gray(D.Config.filename)}`, `doc:config:print`),
            // opt(`  🐷 ${c.yellow(c.italic('chat with slug'))}`, 'tmp:🐷'),
          ];

          if (!hookTmpl.exists) {
            options.push(opt(`  Generate ${c.cyan(D.Hook.filename)} file`, 'doc:tmpl:hookfile'));
          }

          options.push(...[opt(c.gray(c.dim(' (forget)')), 'doc:remove')]);
          options.push(opt(c.gray(c.dim('← back')), 'back'));

          const B = (await Cli.Input.Select.prompt<t.CrdtTool.Command>({
            message: `with ${c.gray(`crdt:${docid.slice(0, -5)}${c.green(docid.slice(-5))}`)}:`,
            options,
            hideDefault: true,
            maxRows: 25,
          })) as t.CrdtTool.Command;

          if (B === 'back') break;

          if (B === 'snapshot') {
            const m = await Imports.snapshot();
            await m.snapshotCommand(cwd, docid);
            return done(0);
          }

        /**
         * TODO 🐷 - make path configurable (via prompt)
         */
        const yamlPath = ['slug'];

        if (B.startsWith('doc:graph')) {
          const m = await Imports.docGraph();

          if (B === 'doc:graph:walk') {
            await m.walkDocumentGraphCommand(cwd, docid, yamlPath);
            return done(0);
          }

          if (B === 'doc:graph:dag') {
            await m.dagHookCommand(cwd, docid, yamlPath);
            return done(0);
          }
        }

        if (B === 'doc:viewer:yaml') {
          const m = await Imports.docYamlViewer();
          await m.startYamlViewerCommand(cwd, docid, yamlPath);
          return done(0);
        }

        if (B === 'doc:graph:lint') {
          const m = await Imports.docGraphLint();
          await m.lintDocumentGraphCommand(cwd, docid, yamlPath);
          return done(0);
        }

          if (B === 'doc:graph:tasks') {
            const m = await Imports.docGraphTasks();
            await m.documentGraphTasksCommand(cwd, docid, yamlPath);
            return done(0);
          }

          if (B === 'doc:indexer:fs') {
            const m = await Imports.indexDocument();
            await m.runDirectoryIndexer(cwd, docid);
            continue;
          }

        if (B === 'doc:config:print') {
          console.info(Fmt.printDocConfig(config.current, docid));
          return done(0);
        }

        if (B === 'doc:tmpl:hookfile') {
          await hookTmpl.write();
          return done(0);
        }

        if (B === 'doc:remove') {
          await promptRemoveDocument(cwd, docid);
          return done(0);
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
