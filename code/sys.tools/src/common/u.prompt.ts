import { type t, Cli, Is, c, exclude } from '../common.ts';
import { Fs } from './libs.ts';

/**
 * Checkbox prompt selection for files.
 */
export async function promptForFileSelection(
  subject: t.StringDir | { paths: t.StringPath[]; base: t.StringDir },
  opts: {
    defaultChecked?: (path: string) => boolean;
    filter?: (file: t.WalkEntry) => boolean;
    exclude?: t.Ary<string>;
    sort?: boolean;
    maxRows?: number;
    message?: string;
  } = {},
) {
  const {
    defaultChecked = () => false,
    sort = false,
    maxRows = 20,
    message = 'Select files',
  } = opts;

  async function getPaths(dir: string) {
    const glob = Fs.glob(dir, { exclude: opts.exclude ?? exclude, includeDirs: false });
    return (await glob.find('**'))
      .filter((file) => opts.filter?.(file) ?? true)
      .map((file) => file.path);
  }

  const dir = Is.record(subject) ? subject.base : subject;
  const paths = Is.string(subject) ? await getPaths(subject) : subject.paths;

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

  return (await Cli.Prompt.Checkbox.prompt({
    message,
    options,
    check: c.green('●'),
    uncheck: c.gray('○'),
    maxRows,
  })) as t.StringPath[];
}
