import { type t, Is } from './common.ts';

export const size: t.CliLib['size'] = () => {
  const fallback: t.CliSize = { width: 80, height: 24 };

  // Deno (preferred):
  try {
    const denoGlobal = globalThis as {
      Deno?: { consoleSize?: () => { columns: number; rows: number } };
    };

    const deno = denoGlobal.Deno;

    if (deno?.consoleSize) {
      const { columns, rows } = deno.consoleSize();
      const width = typeof columns === 'number' && columns > 0 ? columns : fallback.width;
      const height = typeof rows === 'number' && rows > 0 ? rows : fallback.height;
      return { width, height };
    }
  } catch {
    // ignore and fall through
  }

  // Node-style process.stdout (if present):
  const nodeGlobal = globalThis as unknown as {
    process?: { stdout?: { columns?: number; rows?: number } };
  };

  const stdout = nodeGlobal.process?.stdout;

  if (
    stdout &&
    Is.num(stdout.columns) &&
    stdout.columns > 0 &&
    Is.num(stdout.rows) &&
    stdout.rows > 0
  ) {
    return {
      width: stdout.columns,
      height: stdout.rows,
    };
  }

  return fallback;
};
