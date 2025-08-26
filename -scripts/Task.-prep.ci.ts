import { DenoFile, Fs, c } from './common.ts';
import { Paths } from './-PATHS.ts';

export async function main() {
  const tmpl = {
    header: (await Fs.readText('.github/jsr.header.yaml')).data!,
    module: (await Fs.readText('.github/jsr.module.yaml')).data!,
  };

  const incl = ['code/sys/', 'code/sys.ui/', 'code/sys.driver/', 'code/sys.dev'];
  const paths = Paths.modules.filter((path) => incl.some((item) => path.startsWith(item)));
  let yaml = tmpl.header;

  for (const path of paths) {
    const denofile = await DenoFile.load(path);
    const name = denofile.data?.name!;
    let module = tmpl.module.replace(/NAME/, name).replace(/PATH/, path);
    module = indent(module, 6);
    yaml += `\n\n${module}`;
  }

  yaml += '\n';
  const target = '.github/workflows/jsr.yaml';
  await Fs.write(target, yaml);
  console.info(`${c.green('Updated file:')} ${c.gray(target)}\n`);
}

/**
 * Helpers
 */
function indent(text: string, indent: number) {
  return text
    .split('\n')
    .map((line) => `${' '.repeat(indent)}${line}`)
    .filter((line) => (!line.trim() ? line.trim() : line))
    .join('\n');
}
