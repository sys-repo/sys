import { c, Cli, D, Fs, Str, type t } from '../common.ts';
import { ProxyConfigPath } from '../u.config/u.path.ts';

const TITLE = '@sys/http/server/proxy';
const RUN = 'deno run -A jsr:@sys/http/server/proxy';
const CONFIG = 'app';
const CONFIG_DIR = ProxyConfigPath.dir;

export const Fmt = {
  help(_cwd: t.StringDir): string {
    return Cli.Fmt.Help.build({
      tool: TITLE,
      summary: 'Reverse proxy owner endpoint.',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${RUN} --help`,
            `${RUN} config --help`,
            `${RUN} mount --help`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['config', 'show reverse-proxy config commands'],
            ['mount', 'show reverse-proxy mount commands'],
          ],
        },
      ],
    });
  },

  configHelp(_cwd: t.StringDir): string {
    const title = `${TITLE} config`;
    const run = `${RUN} config`;
    return Cli.Fmt.Help.build({
      tool: title,
      summary: 'Manage durable config for reverse proxy instances.',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${run} --help`,
            `${run} add [options]`,
            `${run} add --help`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['add', 'create or update durable reverse-proxy config'],
          ],
        },
      ],
    });
  },

  configAddHelp(_cwd: t.StringDir): string {
    const title = `${TITLE} config add`;
    const run = `${RUN} config add`;
    return Cli.Fmt.Help.build({
      tool: title,
      summary: 'Create or update durable reverse proxy config.',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${run} [options]`,
            `${run} --dry-run [options]`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['-h, --help', 'show config add help'],
            [
              '--config <name|path>',
              `bare name maps to ${CONFIG_DIR}/<name>.yaml; path-like values are used as paths`,
            ],
            ['--name <name>', 'optional proxy display name; defaults from --config'],
            ['--hostname <host>', `listen hostname; defaults to ${D.hostname}`],
            ['--port <port>', `listen port, integer 0..65535; defaults to ${D.port}`],
            ['--dry-run', 'preview the config mutation without writing'],
          ],
        },
        {
          kind: 'lines',
          label: 'Semantics',
          items: [
            'Writes only durable reverse-proxy config state; it does not start a server.',
            'Missing config is created with required lifecycle fields and an empty mounts list.',
            'Existing mounts are preserved when lifecycle fields are updated.',
            'An identical existing config is a no-op success.',
            'The resulting YAML is validated before writing.',
          ],
        },
        {
          kind: 'lines',
          label: 'Examples',
          tone: 'muted',
          items: [
            `${run} --config ${CONFIG}`,
            `${run} --dry-run --config ${CONFIG} --hostname ${D.hostname} --port ${D.port}`,
          ],
        },
      ],
    });
  },

  mountHelp(_cwd: t.StringDir): string {
    const title = `${TITLE} mount`;
    const run = `${RUN} mount`;
    return Cli.Fmt.Help.build({
      tool: title,
      summary: 'Manage durable mounted upstreams for reverse proxy instances.',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${run} --help`,
            `${run} add [options]`,
            `${run} add --help`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['add', 'create or update a durable mounted upstream'],
          ],
        },
      ],
    });
  },

  mountAddHelp(_cwd: t.StringDir): string {
    const title = `${TITLE} mount add`;
    const run = `${RUN} mount add`;
    return Cli.Fmt.Help.build({
      tool: title,
      summary: 'Create or update a mounted upstream in durable reverse proxy config.',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${run} [options]`,
            `${run} --dry-run [options]`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['-h, --help', 'show mount add help'],
            [
              '--config <name|path>',
              `bare name maps to ${CONFIG_DIR}/<name>.yaml; path-like values are used as paths`,
            ],
            ['--mount <route>', 'local mounted path-prefix; must start and end with /'],
            ['--upstream <url>', 'absolute upstream URL-prefix; must end with /'],
            ['--name <name>', 'optional proxy display name when config is created'],
            [
              '--hostname <host>',
              `listen hostname when config is created; defaults to ${D.hostname}`,
            ],
            ['--port <port>', `listen port when config is created; defaults to ${D.port}`],
            ['--dry-run', 'preview the mount mutation without writing'],
          ],
        },
        {
          kind: 'lines',
          label: 'Semantics',
          items: [
            'Writes only durable reverse-proxy config state; it does not start a server.',
            'Missing config is created before adding the mount.',
            'A new mount path is appended to the mounts list.',
            'An existing mount path with a different upstream is updated.',
            'An identical existing mount is a no-op success.',
            'The resulting YAML is validated before writing.',
          ],
        },
        {
          kind: 'lines',
          label: 'Examples',
          tone: 'muted',
          items: [
            `${run} --config ${CONFIG} --mount /payments/ --upstream https://example.com/payments/`,
            `${run} --dry-run --config ${CONFIG} --mount /api/ --upstream https://example.com/api/`,
          ],
        },
      ],
    });
  },

  configAddResult(result: t.HttpProxy.Config.AddResult): string {
    const status = result.kind === 'exists'
      ? 'already configured'
      : result.kind === 'dry-run'
      ? result.created ? 'would create config' : 'would update config'
      : result.kind === 'updated'
      ? 'updated config'
      : 'created config';

    const table = Cli.table();
    table.body([
      [c.gray(' status'), c.white(status)],
      [c.gray(' config'), c.cyan(Fs.trimCwd(result.yamlPath))],
      [c.gray(' name'), c.white(result.config.name)],
      [c.gray(' host'), c.white(result.config.hostname)],
      [c.gray(' port'), c.white(String(result.config.port))],
      [c.gray(' mounts'), c.white(String(result.config.mounts.length))],
      [c.gray(' created'), c.white(String(result.created))],
    ]);

    return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank())
      .trimEnd();
  },

  mountAddResult(result: t.HttpProxy.Mount.AddResult): string {
    const status = result.kind === 'exists'
      ? 'already mounted'
      : result.kind === 'dry-run'
      ? result.created ? 'would create config and mount' : 'would update mount'
      : result.kind === 'updated'
      ? 'updated mount'
      : result.created
      ? 'created config and mount'
      : 'added mount';

    const table = Cli.table();
    table.body([
      [c.gray(' status'), c.white(status)],
      [c.gray(' config'), c.cyan(Fs.trimCwd(result.yamlPath))],
      [c.gray(' mount'), c.white(result.mount.path)],
      [c.gray(' upstream'), c.white(result.mount.target)],
      [c.gray(' mounts'), c.white(String(result.config.mounts.length))],
      [c.gray(' created'), c.white(String(result.created))],
    ]);

    return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank())
      .trimEnd();
  },

  error(error: string): string {
    return c.yellow(error);
  },
} as const;
