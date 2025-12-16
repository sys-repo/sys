import { type t, c, Cli, D, Http, Net, Str } from '../common.ts';
import { Mime } from './u.mime.ts';
import { Open } from './u.open.ts';
import { ServeMenu } from './u.prompt.ts';
import { route } from './u.serve.route.ts';

type Opts = { port?: number };

/**
 * Start a local HTTP server for the given directory.
 */
export async function startServing(
  cwd: t.StringDir,
  location: t.ServeTool.DirConfig,
  opts: Opts = {},
): Promise<void> {
  const { dir, contentTypes } = location;

  /**
   * Map extensions → MIME types (subset of ServeType).
   */
  const mimeByExt = Mime.extensionMap;
  const app = Http.Server.create({ static: false });

  // Pass the readonly MimeType[] directly to the route factory.
  app.use('*', route({ dir, contentTypes }));

  // Static middleware with restricted MIME table.
  const allowedMimes = new Set<string>(contentTypes);
  const staticMimes: Record<string, string> = Object.fromEntries(
    Object.entries(mimeByExt).filter(([, mime]) => allowedMimes.has(mime)),
  );

  app.use('*', Http.Server.static({ root: dir, mimes: staticMimes }));

  console.info();
  const port = Net.port(opts.port ?? D.port);
  const baseOptions = Http.Server.options({ port, dir, silent: false });
  const ac = new AbortController();
  const server = Deno.serve({ ...baseOptions, signal: ac.signal }, app.fetch);

  /**
   * Run Open → Prompt (Loop)
   */
  const runOpenPromptLoop = (() => {
    const baseUrl = `http://localhost:${port}`;
    const EXIT = '__exit__';
    const prefix = 'bundle:open/';

    const toUrl = (value: string): t.StringUrl => {
      const subpath = value.startsWith(prefix) ? value.slice(prefix.length) : value;
      const path = subpath.replace(/^\/+/, '');
      return `${baseUrl}/${path}` as t.StringUrl;
    };

    /** Render loop */
    let lastSelection: string | undefined;

    function renderHeader() {
      const str = Str.builder()
        .blank()
        .line(`  Listening on ${c.cyan(`${baseUrl}/`)}`);
      if (lastSelection) {
        const dir = lastSelection.split('/').pop()!;
        const url = `  ${baseUrl}/${dir}`;
        str.line(`             ${c.dim(c.gray(url))}`);
      }
      return String(str.blank());
    }

    return async (): Promise<void> => {
      const baseMenu = await ServeMenu.bundlesMenuOptions(cwd, location, { includeRoot: true });

      async function promptOnce() {
        const options = [...baseMenu, { name: c.dim(c.gray(`(exit)`)), value: EXIT }];
        console.clear();
        console.info(renderHeader());

        return await Cli.Input.Select.prompt({
          message: 'Open',
          options,
          default: lastSelection,
          hideDefault: true,
        });
      }

      try {
        while (true) {
          const answer = await promptOnce();
          if (answer === EXIT) break;
          lastSelection = answer;
          Open.invokeDetached(cwd, toUrl(answer));
        }
      } finally {
        ac.abort();
        await server.finished;
      }
    };
  })();

  await runOpenPromptLoop();
}
