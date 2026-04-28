import { type t, c, Cli, D, Fmt, Http, Open, Str } from '../common.ts';
import { type OpenMenuPick, OpenTargets } from './u.openTargets.ts';
import { route } from './u.serve.route.ts';

type Opts = { port?: number; host?: 'local' | 'network'; silent?: boolean; keyboard?: boolean };
export type StartServingContext = {
  readonly location: t.ServeTool.LocationYaml.Location;
  readonly host: 'local' | 'network';
  readonly hostname: '127.0.0.1' | '0.0.0.0';
  readonly port: number;
  readonly baseUrl: t.StringUrl;
  readonly url: t.StringUrl;
  readonly server: Deno.HttpServer<Deno.NetAddr>;
  close(): Promise<void>;
};
type ServeResult = { readonly kind: 'back' } | { readonly kind: 'closed' };

/**
 * Start a local HTTP server for the given directory and return the running context.
 */
export function startServer(
  location: t.ServeTool.LocationYaml.Location,
  opts: Opts = {},
): StartServingContext {
  const { dir, name } = location;
  const app = Http.Server.create({ static: false });

  app.use('*', Http.Server.forceDirSlash(dir));
  app.use('*', route({ dir }));
  app.use('*', Http.Server.static({ root: dir }));

  const host = opts.host ?? 'local';
  const hostname = host === 'network' ? '0.0.0.0' : '127.0.0.1';
  const info = normalizeInfo(location.info);
  const infoPath = firstPathInfo(info);
  const started = Http.Server.start(app, {
    port: opts.port ?? D.port,
    hostname,
    name,
    info,
    dir,
    silent: opts.silent === true,
    keyboard: opts.keyboard,
  });
  const port = started.port;
  const server = started.server;
  const baseUrl = host === 'network' ? `http://0.0.0.0:${port}` : `${started.origin}`;
  const url = infoPath ? `${baseUrl}/${Str.trimLeadingSlashes(infoPath)}` : `${baseUrl}/`;

  return {
    location,
    host,
    hostname,
    port,
    baseUrl: baseUrl as t.StringUrl,
    url: url as t.StringUrl,
    server,
    async close() {
      await started.close('serve.close');
    },
  };
}

/**
 * Start a local HTTP server for the given directory and run the interactive menu loop.
 */
export async function startServing(
  cwd: t.StringDir,
  location: t.ServeTool.LocationYaml.Location,
  opts: Opts = {},
): Promise<ServeResult> {
  const context = startServer(location, { ...opts, silent: false });
  return await runOpenPromptLoop(cwd, context);
}

type OpenValue = OpenMenuPick | { cmd: 'reload' } | { cmd: 'back' };

function normalizeInfo(info?: Record<string, string>) {
  if (!info) return undefined;
  return Object.fromEntries(
    Object.entries(info).map(([key, value]) => {
      const trimmed = value.trim();
      const normalized = trimmed.startsWith('/') ? `/${Str.trimLeadingSlashes(trimmed)}` : trimmed;
      return [key, normalized];
    }),
  );
}

function firstPathInfo(info?: Record<string, string>) {
  return Object.values(info ?? {}).find((value) => value.startsWith('/'));
}

async function runOpenPromptLoop(cwd: t.StringDir, context: StartServingContext): Promise<ServeResult> {
  const { location, host, port, baseUrl } = context;
  let didBack = false;
  let lastSelection: OpenValue | undefined;
  let notice: string | undefined;

  const toPath = (value: OpenValue): string => {
    if (value.cmd !== 'open') return '';
    return Str.trimLeadingSlashes(value.path);
  };

  const toUrl = (value: OpenValue): t.StringUrl => {
    const path = toPath(value);
    return `${baseUrl}/${path}`;
  };

  const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

  function renderHeader() {
    const str = Str.builder().blank();

    if (host === 'network') {
      str.line(`  Listening on ${c.cyan('http://')}${c.yellow('0.0.0.0')}${c.cyan(`:${port}/`)}`);
    } else {
      str.line(`  Listening on ${c.cyan(`${baseUrl}/`)}`);
    }

    if (lastSelection) {
      const path = toPath(lastSelection);
      if (path) {
        const url = `  ${baseUrl}/${path}`;
        str.line(`             ${c.dim(c.gray(url))}`);
      }
    }

    if (notice) str.line(`  ${notice}`);

    return String(str.blank());
  }

  const loadOpenMenu = async (text: string) => {
    const spinner = Cli.spinner(Fmt.spinnerText(text));
    spinner.start();
    try {
      return await OpenTargets.menuOptions(location);
    } finally {
      spinner.stop();
    }
  };

  let openMenu = await loadOpenMenu('indexing static targets...');

  const hasOpenPath = (path: string) => openMenu.some((item) => item.value.path === path);
  const syncLastSelection = () => {
    if (!lastSelection || lastSelection.cmd !== 'open') return;
    if (!hasOpenPath(lastSelection.path)) lastSelection = undefined;
  };

  async function promptOnce(): Promise<OpenValue> {
    const options = [
      ...openMenu,
      { name: c.dim(c.gray('  ↻ reload')), value: { cmd: 'reload' } },
      { name: c.dim(c.gray('  ← back')), value: { cmd: 'back' } },
    ];
    console.clear();
    console.info(renderHeader());
    return (await Cli.Input.Select.prompt({
      message: 'HTTP Static',
      options,
      default: lastSelection,
      hideDefault: true,
      maxRows: 20,
    })) as OpenValue;
  }

  try {
    while (true) {
      const answer = await promptOnce();
      if (answer.cmd === 'reload') {
        try {
          openMenu = await loadOpenMenu('reloading static targets...');
          syncLastSelection();
          notice = undefined;
        } catch (error) {
          notice = c.red(`reload failed: ${errorMessage(error)}`);
        }
        continue;
      }
      if (answer.cmd === 'back') {
        didBack = true;
        break;
      }
      notice = undefined;
      lastSelection = answer;
      Open.invokeDetached(cwd, toUrl(answer));
    }
  } finally {
    await context.close();
  }

  return didBack ? { kind: 'back' } : { kind: 'closed' };
}
