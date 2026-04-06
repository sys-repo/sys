import { Fs, Path, Process, type t } from './common.ts';

const DEFAULT_CONFIG_PATH = './deno.json';
const TS_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'] as const;

/**
 * Fail early when projected Deno imports do not satisfy source specifiers.
 */
export const verifyDeno: t.DepsLib['verifyDeno'] = async (input) => {
  const cwd = Path.resolve(input.cwd ?? '.');
  const configPath = Path.resolve(cwd, input.configPath ?? DEFAULT_CONFIG_PATH);
  const paths = await wrangle.paths(cwd, input.include);

  if (paths.length === 0) {
    return { cwd, configPath, paths };
  }

  const output = await Process.invoke({
    cmd: 'deno',
    args: ['check', '--config', configPath, ...paths],
    cwd,
    silent: true,
  });

  if (output.success) {
    return { cwd, configPath, paths };
  }

  const detail = output.text.stderr.trim() || output.text.stdout.trim() ||
    `deno check failed (${output.code})`;
  throw new Error(`Projected Deno imports do not satisfy source specifiers.\n${detail}`);
};

const wrangle = {
  async paths(cwd: t.StringDir, include: readonly t.StringPath[]): Promise<t.StringPath[]> {
    const glob = Fs.glob(cwd, { includeDirs: false });
    const files = new Set<t.StringPath>();

    for (const pattern of include) {
      const matches = await glob.find(pattern);
      matches
        .filter((entry) => entry.isFile)
        .map((entry) => entry.path)
        .filter((path) => wrangle.isTsLike(path))
        .forEach((path) => files.add(path));
    }

    return [...files].sort((a, b) => a.localeCompare(b));
  },

  isTsLike(path: t.StringPath) {
    return TS_EXTENSIONS.some((ext) => path.endsWith(ext));
  },
} as const;
