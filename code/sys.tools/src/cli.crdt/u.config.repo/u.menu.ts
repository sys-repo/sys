import { type t, c, Cli, Fs, Is } from '../common.ts';
import { CrdtRepoSchema } from './u.schema.ts';
import { CrdtReposFs } from './u.fs.ts';

export async function promptRepoSyncMenu(args: {
  cwd: t.StringDir;
  onStartSyncServer?: () => Promise<void>;
  onStartDaemon?: () => Promise<void>;
}): Promise<'back' | 'exit'> {
  const { cwd, onStartSyncServer, onStartDaemon } = args;
  await CrdtReposFs.ensureDir(cwd);
  const path = Fs.join(cwd, CrdtReposFs.file());

  if (!(await Fs.exists(path))) {
    await CrdtReposFs.writeDoc(path, CrdtRepoSchema.initial());
  }

  let lastSelected: string | undefined;
  while (true) {
    const checked = await CrdtReposFs.readYaml(path);
    if (!checked.ok) {
      const display = Fs.trimCwd(path, { prefix: true });
      console.info(`\n${c.yellow('Repo config is invalid.')} ${c.gray(display)}`);
      return 'back';
    }

    const doc = CrdtRepoSchema.normalize(checked.doc);
    const endpoints = doc.sync ?? [];
    const options = buildSyncMenuOptions(endpoints, { onStartSyncServer, onStartDaemon });

    const values = options.map((item) => item.value);
    const picked = await Cli.Input.Select.prompt<string>({
      message: 'Repository:\n',
      options,
      default: values.includes(lastSelected ?? '') ? lastSelected : undefined,
      hideDefault: true,
      maxRows: 25,
    });

    if (picked === 'back') return 'back';
    if (picked === 'start:syncserver') {
      if (Is.func(onStartSyncServer)) await onStartSyncServer();
      continue;
    }
    if (picked === 'start:daemon') {
      if (Is.func(onStartDaemon)) await onStartDaemon();
      continue;
    }
    if (picked === 'add') {
      const next = await Cli.Input.Text.prompt({
        message: 'Sync endpoint',
        hint: 'e.g. sync.example.com',
      });
      const trimmed = String(next ?? '').trim();
      if (!trimmed) continue;
      if (endpoints.some((item) => item.endpoint === trimmed)) {
        console.info(c.yellow('Endpoint already exists.'));
        continue;
      }
      const updated = [...endpoints, { endpoint: trimmed, enabled: true }];
      await saveSyncEndpoints(path, updated);
      lastSelected = trimmed;
      continue;
    }

    const nextSelected = await promptEndpointAction({ path, endpoints, endpoint: picked });
    if (nextSelected) lastSelected = nextSelected;
  }
}

function buildSyncMenuOptions(
  endpoints: t.CrdtTool.RepoYaml.SyncItem[],
  actions: {
    onStartSyncServer?: () => Promise<void>;
    onStartDaemon?: () => Promise<void>;
  },
) {
  const labels = ['add', 'sync', 'start'];
  const labelWidth = Math.max(...labels.map((label) => label.length));
  const baseIndent = '  ';
  const addLabel = `${baseIndent}${padLabel('add', labelWidth)}: <endpoint>`;

  const syncRows = endpoints.map((entry, index) => {
    const tree = Cli.Fmt.Tree.branch([index, endpoints], 1);
    const endpointLabel =
      entry.enabled === false
        ? c.dim(c.gray(`${entry.endpoint} (disabled)`))
        : c.cyan(entry.endpoint);
    const label = `${baseIndent}${padLabel('sync', labelWidth)}: ${tree} ${endpointLabel}`;
    return { name: label, value: entry.endpoint } as const;
  });

  const options = [{ name: addLabel, value: 'add' }, ...syncRows];
  const hasEndpoints = endpoints.length > 0;

  if (hasEndpoints && Is.func(actions.onStartDaemon)) {
    options.push({
      name: repoStartLabel('daemon', { indent: baseIndent, labelWidth }),
      value: 'start:daemon',
    });
  }

  if (hasEndpoints && Is.func(actions.onStartSyncServer)) {
    options.push({
      name: repoStartLabel('sync', { indent: baseIndent, labelWidth }),
      value: 'start:syncserver',
    });
  }

  options.push({ name: c.gray(c.dim('← back')), value: 'back' });
  return options;
}

function padLabel(label: string, width: number): string {
  const pad = Math.max(0, width - label.length);
  return `${' '.repeat(pad)}${label}`;
}

async function saveSyncEndpoints(path: t.StringPath, endpoints: t.CrdtTool.RepoYaml.SyncItem[]) {
  const res = await CrdtReposFs.readYaml(path);
  const base = res.ok ? CrdtRepoSchema.normalize(res.doc) : CrdtRepoSchema.initial();
  const doc: t.CrdtTool.RepoYaml.Doc = { ...base, sync: [...endpoints] };
  await CrdtReposFs.writeDoc(path, doc);
}

async function promptEndpointAction(args: {
  path: t.StringPath;
  endpoints: t.CrdtTool.RepoYaml.SyncItem[];
  endpoint: string;
}): Promise<string | undefined> {
  const { path, endpoints, endpoint } = args;
  const entry = endpoints.find((item) => item.endpoint === endpoint);
  if (!entry) return;
  const enabled = entry.enabled !== false;
  const toggleLabel = enabled ? 'disable' : 'enable';
  const actionLabels = ['edit', toggleLabel, 'delete'] as const;
  const items = actionLabels.map((item, index) => {
    const tree = Cli.Fmt.Tree.branch([index, actionLabels], 1);
    return { name: `  ${tree} ${item}`, value: item } as const;
  });

  const action = await Cli.Input.Select.prompt<'edit' | 'enable' | 'disable' | 'delete' | 'back'>({
    message: `sync ${c.gray(endpoint)}:`,
    options: [...items, { name: `  ${c.gray(c.dim('← back'))}`, value: 'back' }],
    hideDefault: true,
  });

  if (action === 'back') return args.endpoint;

  if (action === 'edit') {
    const next = await Cli.Input.Text.prompt({
      message: 'Sync endpoint',
      default: endpoint,
    });
    const trimmed = String(next ?? '').trim();
    if (!trimmed) return;
    if (trimmed !== endpoint && endpoints.some((item) => item.endpoint === trimmed)) {
      console.info(c.yellow('Endpoint already exists.'));
      return args.endpoint;
    }
    const updated = endpoints.map((item) =>
      item.endpoint === endpoint ? { ...item, endpoint: trimmed } : item,
    );
    await saveSyncEndpoints(path, updated);
    return trimmed;
  }

  if (action === 'enable' || action === 'disable') {
    const updated = endpoints.map((item) =>
      item.endpoint === endpoint ? { ...item, enabled: action === 'enable' } : item,
    );
    await saveSyncEndpoints(path, updated);
    return endpoint;
  }

  if (action === 'delete') {
    const ok = await Cli.Input.Confirm.prompt(`Remove "${endpoint}"?`);
    if (!ok) return args.endpoint;
    const updated = endpoints.filter((item) => item.endpoint !== endpoint);
    if (updated.length === endpoints.length) return args.endpoint;
    await saveSyncEndpoints(path, updated);
    return undefined;
  }
}

export function repoStartLabel(
  kind: 'sync' | 'daemon',
  opts: { indent?: string; labelWidth?: number } = {},
): string {
  const indent = opts.indent ?? '';
  const labelWidth = opts.labelWidth ?? 'start'.length;
  const prefix = `${indent}${padLabel('start', labelWidth)}:`;
  const text = kind === 'sync' ? 'sync server' : 'daemon';
  return `${prefix} ${text}`;
}
