import { Cli, c } from '@sys/cli';
import { Fs } from '@sys/fs';
import { Str } from '@sys/std';

type CopyMode = 'types' | 'files';

/**
 * Build a single concatenated string from a list of file paths.
 * (Unchanged logic from your original helper.)
 */
export async function pathsToFileStrings(paths: string[]) {
  let result = '';
  const hr = `# ${'-'.repeat(80)}\n`;
  const add = (path: string, text: string) => {
    const isFirst = result === '';
    if (!isFirst) result += hr;
    result += `# file: ${Fs.basename(path)}`;
    result += '\n\n\n';
    result += text.trim();
    result += '\n\n\n';
  };

  for (const path of paths) {
    const res = await Fs.readText(path);
    if (res.data) add(path, res.data);
  }

  return result;
}

/**
 * Sub-command: Copy Files ("src" code).
 */
export async function copyFiles() {
  const dir = Fs.cwd('terminal');
  const paths = (await Fs.glob(dir).find('**', { includeDirs: false })).map((file) => file.path);

  const defaultChecked = (path: string) => {
    return false;
    if (path.includes('.test.')) return false;
    if (path.includes('-SPEC.')) return false;
    if (path.includes('-spec/')) return false;
    return true;
  };

  const options = paths
    .filter((path) => {
      const ext = Fs.extname(path);
      return ['.ts', '.tsx', '.md', '.yaml'].includes(ext);
    })
    .map((path) => {
      const name = path.slice(dir.length + 1);
      const checked = defaultChecked(path);
      return {
        name: checked ? c.green(name) : name,
        value: path,
        checked,
      };
    });

  console.info(Str.SPACE);
  console.info(c.gray(`Total: ${paths.length} files`));

  const selected = await Cli.Prompt.Checkbox.prompt({
    message: 'Select files to copy:\n',
    options,
    check: c.green('●'),
    uncheck: c.gray(c.dim('○')),
    maxRows: 20,
  });

  if (selected.length > 0) {
    const text = await pathsToFileStrings(selected);
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean); // ← NB: remove empty lines.

    Cli.copyToClipboard(text);
    const total = selected.length;
    const filesLabel = Str.plural(total, 'file', 'files');
    const linesLabel = Str.plural(lines.length, 'line', 'lines');

    let msg = '\n';
    msg += `${total.toLocaleString()} ${filesLabel}`;
    msg += ` (${c.white(c.bold(`${lines.length.toLocaleString()} ${linesLabel}`))})`;
    msg += ` copied to clipboard\n`;

    console.info(c.gray(msg));
  }
}

/**
 * Sub-command: Copy Types
 */
export async function copyTypes() {
  console.info(c.gray('\nCopy Types: (stub) 🐷\n'));
}

/**
 * Entry-point: prompt for which copy mode to run.
 */
export async function run() {
  const mode = await Cli.Prompt.Select.prompt<CopyMode>({
    message: 'Select copy mode:\n',
    options: [
      { name: 'Copy Types', value: 'types' as const },
      { name: 'Copy Files (src)', value: 'files' as const },
    ],
  });

  if (mode === 'files') await copyFiles();
  else if (mode === 'types') await copyTypes();
}

// Execute by default when run as a script.
await run();
