import { type t, c, Cli, D, Http, Net, Open, Str } from '../common.ts';
import { type OpenMenuPick, OpenTargets } from './u.openTargets.ts';
import { route } from './u.serve.route.ts';

type Opts = { port?: number; host?: 'local' | 'network' };
type ServeResult = { readonly kind: 'back' } | { readonly kind: 'closed' };

/**
 * Start a local HTTP server for the given directory.
 */
export async function startServing(
  cwd: t.StringDir,
  location: t.ServeTool.LocationYaml.Location,
  opts: Opts = {},
): Promise<ServeResult> {
  const { dir } = location;
  const app = Http.Server.create({ static: false });

  app.use('*', route({ dir }));
  app.use('*', Http.Server.static({ root: dir }));

  console.info();
  const port = Net.port(opts.port ?? D.port);
  const baseOptions = Http.Server.options({ port, dir, silent: false });
  const ac = new AbortController();
  const host = opts.host ?? 'local';
  const hostname = host === 'network' ? '0.0.0.0' : '127.0.0.1';
  const server = Deno.serve({ ...baseOptions, hostname, signal: ac.signal }, app.fetch);

  /**
   * Run Open → Prompt (Loop)
   */
  const runOpenPromptLoop = (() => {
    const baseUrl = host === 'network' ? `http://0.0.0.0:${port}` : `http://localhost:${port}`;
    type OpenValue = OpenMenuPick | { cmd: 'back' };
    let didBack = false;
    let lastSelection: OpenValue | undefined;

    const toPath = (value: OpenValue): string => {
      if (value.cmd !== 'open') return '';
      return Str.trimLeadingSlashes(value.path);
    };

    const toUrl = (value: OpenValue): t.StringUrl => {
      const path = toPath(value);
      return `${baseUrl}/${path}`;
    };

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

      return String(str.blank());
    }

    return async (): Promise<ServeResult> => {
      const baseMenu = await OpenTargets.menuOptions(location);

      async function promptOnce(): Promise<OpenValue> {
        const options = [...baseMenu, { name: c.dim(c.gray('  ← back')), value: { cmd: 'back' } }];
        console.clear();
        console.info(renderHeader());
        return (await Cli.Input.Select.prompt({
          message: 'Open',
          options,
          default: lastSelection,
          hideDefault: true,
          maxRows: 20,
        })) as OpenValue;
      }

      try {
        while (true) {
          const answer = await promptOnce();
          if (answer.cmd === 'back') {
            didBack = true;
            break;
          }
          lastSelection = answer;
          Open.invokeDetached(cwd, toUrl(answer));
        }
      } finally {
        ac.abort();
        await server.finished;
      }
      return didBack ? { kind: 'back' } : { kind: 'closed' };
    };
  })();

  return await runOpenPromptLoop();
}
