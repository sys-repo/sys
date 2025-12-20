import { type t, c, Cli, Time } from './common.ts';

type Pick =
  | { readonly kind: 'back' }
  | { readonly kind: 'mappings'; readonly key: string }
  | { readonly kind: 'provider'; readonly key: string }
  | { readonly kind: 'renamed'; readonly from: string; readonly to: string }
  | { readonly kind: 'deleted'; readonly key: string };

/**
 * Interactive menu for configuring a single deploy endpoint.
 *
 * This menu owns only endpoint-scoped configuration choices. It does not run
 * deploy operations.
 */
export async function endpointMenu(args: {
  readonly config: t.DeployTool.Config.File;
  readonly key: string;
}): Promise<Pick> {
  const { config } = args;
  let key = args.key;

  const dim = (s: string) => c.gray(c.dim(s));
  const find = (name: string) => (config.current.endpoints ?? []).find((e) => e.name === name);

  while (true) {
    const endpoint = find(key);
    if (!endpoint) return { kind: 'back' };
    const title = `${c.gray('Endpoint:')} ${c.cyan(endpoint.name)}\n`;

    const picked = await Cli.Input.Select.prompt<
      'mappings' | 'provider' | 'rename' | 'delete' | 'back'
    >({
      message: title,
      options: [
        { name: '  mappings   →', value: 'mappings' },
        { name: '  provider   →', value: 'provider' },
        { name: '  rename', value: 'rename' },
        { name: dim(' (delete)'), value: 'delete' },
        { name: dim('← back'), value: 'back' },
      ],
      hideDefault: true,
    });

    if (picked === 'back') return { kind: 'back' };
    if (picked === 'mappings') return { kind: 'mappings', key };
    if (picked === 'provider') return { kind: 'provider', key };

    if (picked === 'rename') {
      const exists = (name: string) =>
        (config.current.endpoints ?? []).some((e) => e.name === name);

      const raw = await Cli.Input.Text.prompt({
        message: 'Rename endpoint',
        default: endpoint.name,
        validate(value) {
          const next = String(value ?? '').trim();
          if (!next) return 'Name required.';
          if (next !== endpoint.name && exists(next)) return 'Name already exists.';
          return true;
        },
      });

      const nextName = raw.trim();
      if (nextName === endpoint.name) return { kind: 'back' };

      config.change((doc) => {
        const now = Time.now.timestamp;
        const current = doc.endpoints ?? [];
        doc.endpoints = current.map((e) =>
          e.name === endpoint.name ? { ...e, name: nextName, lastUsedAt: now } : e,
        );
      });

      await config.fs.save();
      const from = key;
      key = nextName;
      return { kind: 'renamed', from, to: nextName };
    }

    if (picked === 'delete') {
      const yes = await Cli.Input.Confirm.prompt({
        message: `Delete ${c.cyan(endpoint.name)}?`,
        default: false,
      });

      if (!yes) continue;

      config.change((doc) => {
        const current = doc.endpoints ?? [];
        doc.endpoints = current.filter((e) => e.name !== endpoint.name);
      });

      await config.fs.save();
      return { kind: 'deleted', key };
    }
  }
}
