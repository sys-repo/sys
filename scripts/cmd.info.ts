import { Fs, c } from '@sys/std-s';

/**
 * Count the lines of files at the given list of paths.
 */
async function countLines(paths: string[]) {
  type FileStats = { path: string; total: { lines: number } };
  const files: FileStats[] = [];

  const process = async (path: string) => {
    const fileInfo = await Deno.stat(path);
    if (fileInfo.isFile) {
      const file = await Deno.readTextFile(path);
      const lines = file.split('\n');
      files.push({ path, total: { lines: lines.length } });
    }
  };

  await Promise.all(paths.map(process));

  return {
    get files() {
      return files;
    },
    get total() {
      return files.reduce((acc, next) => {
        return acc + next.total.lines;
      }, 0);
    },
  } as const;
}

/**
 * Lookup stats about the mono-repo.
 */
async function info(options: { lines?: boolean } = {}) {
  const exclude = [
    '**/node_modules/**',
    '**/_archive/**',
    '**/-tmpl/**',
    '**/spikes/**',
    '**/compiler/**',
    '**/compiler.samples/**',
    '**/dist/**',
  ];
  const pattern = 'code/**/*.{ts,tsx,mts}';
  const files = await Fs.glob(import.meta.dirname, '..').find(pattern, { exclude });

  console.info('👋');
  console.info('Deno.version:  ', c.green(Deno.version.deno));
  console.info('  typescript:  ', c.green(Deno.version.typescript));
  console.info('          v8:  ', c.green(Deno.version.v8));

  console.info('↓');
  console.info('Code.pattern:  ', c.green(pattern));
  console.info('     files:    ', c.yellow(files.length.toLocaleString()));
  if (options.lines) {
    const lines = await countLines(files.map((file) => file.path));
    console.info('     lines:    ', c.yellow(lines.total.toLocaleString()));
  }
}

/**
 * System/Repo info.
 */
console.log();
await info({ lines: true });
console.info();
