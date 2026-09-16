import { expect, Fs, Path, type t } from '../../-test.ts';
import { Wrangle } from '../u/u.wrangle.ts';

type ConsumerOptions = {
  packageJson?: { dependencies: Record<string, string> };
  imports?: Record<string, string>;
  project?: string;
};
type Command = Awaited<ReturnType<typeof Wrangle.command>>;

/** Own the temporary consumer and every startup artifact created for it. */
export async function createConsumer(options: ConsumerOptions = {}) {
  const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle-' });
  const root = tmp.absolute;
  const cwd = options.project ? Path.join(root, options.project) : root;
  const commands: Command[] = [];
  const paths: t.ViteConfig.Paths = {
    cwd,
    app: { entry: 'index.html', outDir: 'dist', base: '.' },
  };
  try {
    await Fs.ensureDir(cwd);
    if (options.packageJson) {
      await Fs.writeJson(Path.join(root, 'package.json'), options.packageJson);
    }
    await Fs.writeJson(Path.join(root, 'deno.json'), {
      workspace: [],
      imports: options.imports ?? {},
    });
  } catch (error) {
    await Fs.remove(root, { log: false });
    throw error;
  }

  return {
    root,
    cwd,
    paths,
    async command(arg: string) {
      const result = await Wrangle.command(paths, arg);
      commands.push(result);
      return result;
    },
    async [Symbol.asyncDispose]() {
      try {
        for (const command of commands) await command.dispose();
      } finally {
        await Fs.remove(root, { log: false });
      }
    },
  } as const;
}

/** Inspect one emitted option token; duplicate flags must remain observable. */
export function option(args: readonly string[], name: string): string {
  const prefix = `${name}=`;
  const matches = args.filter((arg) => arg.startsWith(prefix));
  expect(matches, name).to.have.length(1);
  return matches[0].slice(prefix.length);
}

/** Read the generated startup map, failing at the missing artifact rather than a later lookup. */
export async function readImportMap(args: readonly string[]) {
  const path = option(args, '--import-map');
  const result = await Fs.readJson<{ imports: Record<string, string> }>(path);
  expect(result.error, 'startup import map read').to.eql(undefined);
  const imports = result.data?.imports;
  if (!imports) throw new Error('Expected imports in the Vite startup map');
  return { path, imports } as const;
}
