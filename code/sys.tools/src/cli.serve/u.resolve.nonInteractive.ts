import { type t, Fs, Open } from './common.ts';
import { ServeFs } from './u.yaml/mod.ts';

type Resolved = {
  readonly location: t.ServeTool.LocationYaml.Location;
  readonly host: 'local' | 'network';
  readonly open: boolean;
};

export async function resolveNonInteractive(cwd: t.StringDir, args: t.ServeTool.CliParsedArgs): Promise<Resolved> {
  const host = resolveHost(args.host);
  const open = args.open === true;

  const hasDir = typeof args.dir === 'string' && args.dir.trim().length > 0;
  const hasConfig = typeof args.config === 'string' && args.config.trim().length > 0;

  if (hasDir === hasConfig) {
    throw new Error('Exactly one of --dir or --config is required with --non-interactive.');
  }

  if (hasDir) {
    const dir = Fs.resolve(cwd, args.dir!) as t.StringDir;
    return {
      location: {
        name: Fs.basename(dir) || 'site',
        dir,
      },
      host,
      open,
    };
  }

  const yamlPath = Fs.resolve(cwd, args.config!) as t.StringPath;
  const loaded = await ServeFs.loadLocation(yamlPath);
  if (!loaded.ok) {
    throw new Error(`Could not load serve config: ${Fs.trimCwd(yamlPath)}`);
  }

  return {
    location: loaded.location,
    host,
    open,
  };
}

function resolveHost(value?: string): 'local' | 'network' {
  if (value === undefined || value === '') return 'local';
  if (value === 'local' || value === 'network') return value;
  throw new Error(`Invalid --host value: "${value}". Use "local" or "network".`);
}
