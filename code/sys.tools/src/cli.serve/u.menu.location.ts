import { type t, c, Cli, opt } from './common.ts';

export type ServeLocationMenuPick =
  | { readonly kind: 'back' }
  | { readonly kind: 'start'; readonly host: 'local' | 'network' }
  | { readonly kind: 'bundles' }
  | { readonly kind: 'remove' };

export async function serveLocationMenu(args: {
  readonly location: t.ServeTool.LocationYaml.Location;
  readonly port: number;
  readonly yamlPath: t.StringPath;
}): Promise<ServeLocationMenuPick> {
  const { location, port } = args;

  const fmtLocalhost = c.cyan(`localhost:${port}`);
  const fmtNetwork = c.yellow(`network:${port}`);

  const dim = (s: string) => c.gray(c.dim(s));

  const picked = await Cli.Input.Select.prompt<t.ServeTool.Command>({
    message: `With: ${c.gray(location.name)}`,
    options: [
      opt(`  start server   → ${fmtLocalhost}`, 'serve:start/local'),
      opt(`  start server   → ${fmtNetwork}`, 'serve:start/network'),
      opt(`  manage bundles →`, 'bundle'),
      opt(dim(` (remove)`), 'dir:remove'),
      opt(dim(`← back`), 'back'),
    ],
    hideDefault: true,
  });

  if (picked === 'back') return { kind: 'back' };
  if (picked === 'dir:remove') return { kind: 'remove' };
  if (picked === 'bundle') return { kind: 'bundles' };
  if (picked === 'serve:start/local') return { kind: 'start', host: 'local' };
  return { kind: 'start', host: 'network' };
}
