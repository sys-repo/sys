import { c, Cli, Fs, pkg, Str, TemplateNames } from './common.ts';

/**
 * Select from a list of templates.
 */
export async function selectTemplate() {
  const title = c.gray(`${c.green(pkg.name)} ${pkg.version}`);
  console.info(`${Str.SPACE}\n${title}`);

  // Display list of templates.
  let name = '';
  if (!name) {
    const label = (v: string) => (v.startsWith('@') ? `run:   ${v}` : `make:  ${v}`);
    name = await Cli.Prompt.Select.prompt({
      message: 'Select Template:',
      options: TemplateNames.map((value: string) => ({ name: label(value), value })),
    });
  }

  // Finish up.
  return name;
}

/**
 * Retrieve the name of a directory.
 */
export async function directoryName() {
  const dirname = await Cli.Prompt.Input.prompt('Directory Name:');
  return Fs.join(Fs.cwd('terminal'), dirname);
}

/**
 * Interactive input prompt.
 */
export const Prompt = {
  selectTemplate,
  directoryName,
} as const;
