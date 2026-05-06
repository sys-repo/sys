import { Str, type t } from './common.ts';
import { c, Cli, Fmt as CliFmt } from '@sys/cli';
import { Fs } from '@sys/fs';
import { StaticConfigPath } from './u.config.path.ts';

const TITLE = '@sys/http/server/static';
const RUN = 'deno run -A jsr:@sys/http/server/static';
const CONFIG = 'view';
const CONFIG_DIR = StaticConfigPath.dir;

export const Fmt = {
  help(_cwd: t.StringDir): string {
    return CliFmt.Help.build({
      tool: TITLE,
      summary: 'Static HTTP server lifecycle endpoint.',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${RUN} [options]`,
            `${RUN} --help`,
            `${RUN} config --help`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['-h, --help', 'show help'],
            ['--dir <path>', 'static root to serve; defaults to .'],
            ['--hostname <host>', 'listen hostname; defaults to 127.0.0.1'],
            ['--port <port>', 'listen port; defaults to the HTTP server convention'],
            ['--name <name>', 'display name in startup output'],
            ['--silent', 'suppress startup output'],
          ],
        },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['config', 'show static-server config commands'],
          ],
        },
        {
          kind: 'lines',
          label: 'Examples',
          tone: 'muted',
          items: [
            `${RUN} --dir . --hostname 127.0.0.1 --port 4040`,
          ],
        },
      ],
    });
  },

  configHelp(_cwd: t.StringDir): string {
    const title = `${TITLE} config`;
    const run = `${RUN} config`;
    return CliFmt.Help.build({
      tool: title,
      summary: 'Manage durable config for static HTTP server instances.',
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
            ['add', 'create or update durable static-server config'],
          ],
        },
      ],
    });
  },

  configAddHelp(_cwd: t.StringDir): string {
    const title = `${TITLE} config add`;
    const run = `${RUN} config add`;
    return CliFmt.Help.build({
      tool: title,
      summary: 'Create or update durable static HTTP server config.',
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
            ['--name <name>', 'optional static server display name; defaults from --config'],
            ['--dir <path>', 'static root to serve; defaults to .'],
            ['--hostname <host>', 'listen hostname; defaults to 127.0.0.1'],
            ['--port <port>', 'listen port, integer 0..65535; defaults to 4040'],
            ['--dry-run', 'preview the config mutation without writing'],
          ],
        },
        {
          kind: 'lines',
          label: 'Semantics',
          items: [
            'Writes only durable static-server config state; it does not start a server.',
            'Missing config is created with the required static-server fields.',
            'An identical existing config is a no-op success.',
            'An existing different config is updated after validation.',
            'The resulting YAML is validated before writing.',
          ],
        },
        {
          kind: 'lines',
          label: 'Examples',
          tone: 'muted',
          items: [
            `${run} --config ${CONFIG}`,
            `${run} --dry-run --config ${CONFIG} --dir ./public --hostname 127.0.0.1 --port 8080`,
          ],
        },
      ],
    });
  },

  configAddResult(result: t.HttpStatic.ConfigAddResult): string {
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
      [c.gray(' dir'), c.white(result.config.dir)],
      [c.gray(' host'), c.white(result.config.hostname)],
      [c.gray(' port'), c.white(String(result.config.port))],
      [c.gray(' created'), c.white(String(result.created))],
    ]);

    return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank())
      .trimEnd();
  },

  error(error: string): string {
    return c.yellow(error);
  },
} as const;
