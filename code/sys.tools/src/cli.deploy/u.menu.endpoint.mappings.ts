import { type t, c, Cli } from './common.ts';

type Pick = { readonly kind: 'back' } | { readonly kind: 'selected'; readonly index: number };

/**
 * Interactive menu for browsing the directory mappings of a single endpoint.
 *
 * Owns only:
 * - listing
 * - selection (by index)
 * - back navigation
 *
 * Mutations (add/edit/remove) are intentionally handled elsewhere.
 */
export async function endpointMappingsMenu(args: {
  readonly config: t.DeployTool.Config.File;
  readonly key: string;
}): Promise<Pick> {
  const { config } = args;
  const key = args.key;

  const find = (name: string) => (config.current.endpoints ?? []).find((e) => e.name === name);

  const endpoint = find(key);
  if (!endpoint) return { kind: 'back' };

  const title = `${c.gray('Endpoint:')} ${c.cyan(endpoint.name)}\n${c.gray('Mappings:')}\n`;

  const mappings = endpoint.mappings ?? [];
  if (mappings.length === 0) {
    const picked = await Cli.Input.Select.prompt<'back'>({
      message: title,
      options: [{ name: c.gray('← back'), value: 'back' }],
      hideDefault: true,
    });
    if (picked === 'back') return { kind: 'back' };
    return { kind: 'back' };
  }

  const options = mappings.map((m, i) => {
    const source = String(m.dir.source ?? '').trim();
    const staging = String(m.dir.staging ?? '').trim();
    const mode = String(m.mode ?? '').trim();

    const left = `${c.cyan(source)} ${c.gray('→')} ${c.gray(staging || '.')}`;
    const right = c.gray(`(${mode})`);
    const name = `${left} ${right}`;

    return { name, value: String(i) };
  });

  const picked = await Cli.Input.Select.prompt<string | 'back'>({
    message: title,
    options: [...options, { name: c.gray('← back'), value: 'back' }],
    hideDefault: true,
  });

  if (picked === 'back') return { kind: 'back' };

  const index = Number(picked);
  if (!Number.isFinite(index) || index < 0 || index >= mappings.length) return { kind: 'back' };
  return { kind: 'selected', index };
}
