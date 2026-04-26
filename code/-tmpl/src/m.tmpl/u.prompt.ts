import { type t, c, Cli, Fs, pkg, Str, TemplateNames } from './common.ts';

export function label(v: string) {
  if (v.startsWith('@')) return `run:   ${v}`;
  if (v === 'repo') return 'make:  repo (workspace)';
  return `make:  ${v}`;
}

/**
 * Select from a list of templates.
 */
export async function selectTemplate() {
  const title = c.gray(`${c.green(pkg.name)} ${pkg.version}`);
  console.info(`${Str.SPACE}\n${title}`);

  // Display list of templates.
  let name = '';
  if (!name) {
    name = await Cli.Input.Select.prompt({
      message: 'Template:',
      options: TemplateNames.map((value: string) => ({ name: label(value), value })),
    });
  }

  // Finish up.
  return name;
}

/**
 * Retrieve the name of a directory.
 */
export async function directoryName(cwd: t.StringDir = Fs.cwd('terminal')) {
  const dirname = await Cli.Input.Text.prompt('Directory Name:');
  return Fs.join(cwd, dirname);
}

/**
 * Interactive input prompt.
 */
export const Prompt = {
  selectTemplate,
  directoryName,
} as const;
