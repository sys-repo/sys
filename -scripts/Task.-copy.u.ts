import { Cli, c } from '@sys/cli';
import { Fs } from '@sys/fs';
import { Str } from '@sys/std';
import { Token } from '@sys/text/gpt';

/**
 * Build a single concatenated string from a list of file paths.
 * (Unchanged logic from your original helper.)
 */
async function pathsToFileStrings(paths: string[]) {
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

type SelectAndCopyOptions = {
  dir: string;
  message: string;
  totalLabel?: string;
  defaultChecked?: (path: string) => boolean;
  sort?: boolean;
  maxRows?: number;
};

export async function selectAndCopy(paths: string[], opts: SelectAndCopyOptions) {
  const {
    dir,
    message,
    totalLabel = 'files',
    defaultChecked = () => false,
    sort = false,
    maxRows = 20,
  } = opts;

  console.info(Str.SPACE);
  console.info(c.gray(`Total: ${paths.length.toLocaleString()} ${totalLabel}`));

  let options = paths.map((path) => {
    const name = path.slice(dir.length + 1);
    const checked = defaultChecked(path);
    return {
      name: checked ? c.green(name) : name,
      value: path,
      checked,
    };
  });

  if (sort) options = options.sort((a, b) => a.value.localeCompare(b.value));

  const selected = await Cli.Prompt.Checkbox.prompt({
    message,
    options,
    check: c.green('●'),
    uncheck: c.gray(c.dim('○')),
    maxRows,
  });

  if (selected.length > 0) {
    const text = await pathsToFileStrings(selected);
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    Cli.copyToClipboard(text);

    const tokens = Token.count(text);
    const total = selected.length;
    const filesLabel = Str.plural(total, 'file', 'files');
    const linesLabel = Str.plural(lines.length, 'line', 'lines');
    const tokensLabel = Str.plural(tokens, 'token', 'tokens');

    let stats = `${lines.length.toLocaleString()} ${linesLabel}`;
    stats += `, ${tokens.toLocaleString()} ${tokensLabel}`;

    let msg = '\n';
    msg += `${total.toLocaleString()} ${filesLabel}`;
    msg += ` (${c.white(c.bold(`${stats}`))})`;
    msg += ` copied to clipboard\n`;

    console.info(c.gray(msg));
  } else {
    console.info(c.gray('\nNo files selected.\n'));
  }
}
