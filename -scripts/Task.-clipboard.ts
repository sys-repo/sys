import { Str } from '@sys/std';
import { Cli, c } from '@sys/cli';
import { Fs } from '@sys/fs';

const dir = Fs.cwd('terminal');
const paths = (await Fs.glob(dir).find('**', { includeDirs: false })).map((file) => file.path);

const defaultChecked = (path: string) => {
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
console.info(c.gray(`Total: ${paths.length}`));

const selected = await Cli.Prompt.Checkbox.prompt({
  message: `Select files to copy:\n`,
  options,
  check: c.green('●'),
  uncheck: c.gray(c.dim('○')),
  maxRows: 20,
});

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

if (selected.length > 0) {
  const text = await pathsToFileStrings(selected);
  Cli.copyToClipboard(text);
  const total = selected.length;
  const msg = `\n${total} ${Str.plural(total, 'file', 'files')} copied to clipboard`;
  console.info(c.gray(msg));
}
