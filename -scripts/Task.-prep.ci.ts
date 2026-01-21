import { Paths } from './-PATHS.ts';
import { DenoFile, Fs, c } from './common.ts';

const publishEnvBlock = {
  first: [
    'env: &publish-secrets',
    '  DENO_SUBHOSTING_ACCESS_TOKEN: ${{ secrets.DENO_SUBHOSTING_ACCESS_TOKEN }}',
    '  DENO_SUBHOSTING_DEPLOY_ORG_ID: ${{ vars.DENO_SUBHOSTING_DEPLOY_ORG_ID }}',
    '  PRIVY_APP_ID: ${{ vars.PRIVY_APP_ID }}',
    '  PRIVY_APP_SECRET: ${{ secrets.PRIVY_APP_SECRET }}',
  ].join('\n'),
  later: ['env:', '  <<: *publish-secrets'].join('\n'),
};

export async function main() {
  const tmpl = {
    header: (await Fs.readText('.github/-tmpl/jsr.header.yaml')).data!,
    module: (await Fs.readText('.github/-tmpl/jsr.module.yaml')).data!,
  };

  const incl = [
    //
    'code/sys/',
    'code/sys.ui/',
    'code/sys.driver/',
    'code/sys.dev',
    'code/sys.tools',
    'code/-tmpl',
    'deploy/@tdb.edu.slug',
  ];
  const paths = Paths.modules.filter((path) => incl.some((item) => path.startsWith(item)));
  let yaml = tmpl.header;
  let firstModule = true;

  for (const path of paths) {
    const denofile = await DenoFile.load(path);
    const name = denofile.data?.name!;
    let module = tmpl.module.replace(/NAME/, name).replace(/PATH/, path);
    const envBlock = firstModule ? publishEnvBlock.first : publishEnvBlock.later;
    firstModule = false;
    module = module.replace('ENV_BLOCK', envBlock);
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
