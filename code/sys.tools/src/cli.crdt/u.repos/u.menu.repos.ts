import { type t, c, Cli, Fs, Is } from '../common.ts';
import { CrdtRepoSchema } from './u.schema.ts';
import { CrdtReposFs } from './u.fs.ts';

export async function promptRepoSyncMenu(cwd: t.StringDir): Promise<'back' | 'exit'> {
  await CrdtReposFs.ensureDir(cwd);
  const path = Fs.join(cwd, CrdtReposFs.file());

  if (!(await Fs.exists(path))) {
    await CrdtReposFs.writeDoc(path, CrdtRepoSchema.initial());
  }

  while (true) {
    const checked = await CrdtReposFs.readYaml(path);
    if (!checked.ok) {
      console.info(c.yellow('Repo config is invalid. Use edit to fix.'));
      return 'back';
    }

    const endpoints = checked.doc.sync ?? [];
    const options = buildSyncMenuOptions(endpoints);

    const picked = await Cli.Input.Select.prompt<string>({
      message: 'Repo:',
      options,
      hideDefault: true,
      maxRows: 25,
    });

    if (picked === 'back') return 'back';
    if (picked === 'add') {
      const next = await Cli.Input.Text.prompt({
        message: 'Sync endpoint',
        hint: 'e.g. sync.example.com',
      });
      const trimmed = String(next ?? '').trim();
      if (!trimmed) continue;
      if (endpoints.includes(trimmed)) {
        console.info(c.yellow('Endpoint already exists.'));
        continue;
      }
      const updated = [...endpoints, trimmed];
      await saveSyncEndpoints(path, updated);
      continue;
    }

    await promptEndpointAction({ path, endpoints, endpoint: picked });
  }
}

function buildSyncMenuOptions(endpoints: string[]) {
  const labelWidth = Math.max('add'.length, 'sync'.length);
  const baseIndent = '  ';
  const addLabel = `${baseIndent}${padLabel('add', labelWidth)}: <endpoint>`;

  const syncRows = endpoints.map((endpoint, index) => {
    const tree = Cli.Fmt.Tree.branch([index, endpoints], 1);
    const label = `${baseIndent}${padLabel('sync', labelWidth)}: ${tree} ${c.cyan(endpoint)}`;
    return { name: label, value: endpoint } as const;
  });

  return [
    { name: addLabel, value: 'add' },
    ...syncRows,
    { name: c.gray(c.dim('← back')), value: 'back' },
  ];
}

function padLabel(label: string, width: number): string {
  const pad = Math.max(0, width - label.length);
  return `${' '.repeat(pad)}${label}`;
}

async function saveSyncEndpoints(path: t.StringPath, endpoints: string[]) {
  const doc: t.CrdtTool.RepoYaml.Doc = { sync: [...endpoints] };
  await CrdtReposFs.writeDoc(path, doc);
}

async function promptEndpointAction(args: {
  path: t.StringPath;
  endpoints: string[];
  endpoint: string;
}): Promise<void> {
  const { path, endpoints, endpoint } = args;
  const action = await Cli.Input.Select.prompt<'edit' | 'delete' | 'back'>({
    message: `sync ${c.gray(endpoint)}:`,
    options: [
      { name: `  ${Cli.Fmt.Tree.branch([0, [0, 1]], 1)} edit`, value: 'edit' },
      { name: `  ${Cli.Fmt.Tree.branch([1, [0, 1]], 1)} delete`, value: 'delete' },
      { name: `  ${c.gray(c.dim('← back'))}`, value: 'back' },
    ],
    hideDefault: true,
  });

  if (action === 'back') return;

  if (action === 'edit') {
    const next = await Cli.Input.Text.prompt({
      message: 'Sync endpoint',
      default: endpoint,
    });
    const trimmed = String(next ?? '').trim();
    if (!trimmed) return;
    if (trimmed !== endpoint && endpoints.includes(trimmed)) {
      console.info(c.yellow('Endpoint already exists.'));
      return;
    }
    const updated = endpoints.map((item) => (item === endpoint ? trimmed : item));
    await saveSyncEndpoints(path, updated);
    return;
  }

  if (action === 'delete') {
    const updated = endpoints.filter((item) => item !== endpoint);
    if (updated.length === endpoints.length) return;
    await saveSyncEndpoints(path, updated);
  }
}
