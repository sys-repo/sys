import { describe, expect, Json, Path, ROOT, it } from '../../../-test.ts';

describe('OptimizeImportsPlugin graph proof', () => {
  it('reduces ui-react-devharness local module graph breadth for the derived narrow import', async () => {
    const counts = await graphCounts({
      packageDir: ROOT.resolve('code/sys.ui/ui-react-devharness').replaceAll('\\', '/'),
      rootImport: "import { useKeyboard } from '@sys/ui-react-devharness';",
      narrowImport: "import { useKeyboard } from '@sys/ui-react-devharness/hooks';",
      symbol: 'useKeyboard',
    });

    expect(counts.root > counts.narrow).to.eql(true);
  });

});

async function graphCounts(args: { packageDir: string; rootImport: string; narrowImport: string; symbol: string }) {
  const dir = await Deno.makeTempDir({ prefix: 'optimize-imports-graph-proof-' });
  const rootFile = Path.join(dir, 'root.ts');
  const narrowFile = Path.join(dir, 'narrow.ts');

  try {
    await Deno.writeTextFile(rootFile, `${args.rootImport}\nconsole.info(${args.symbol});\n`);
    await Deno.writeTextFile(narrowFile, `${args.narrowImport}\nconsole.info(${args.symbol});\n`);

    const rootInfo = await denoInfo(rootFile);
    const narrowInfo = await denoInfo(narrowFile);
    return {
      root: countLocalModules(rootInfo, args.packageDir),
      narrow: countLocalModules(narrowInfo, args.packageDir),
    } as const;
  } finally {
    await Deno.remove(dir, { recursive: true }).catch(() => undefined);
  }
}

async function denoInfo(entry: string) {
  const cmd = new Deno.Command('deno', {
    cwd: ROOT.dir,
    args: ['info', '--json', entry],
    stderr: 'piped',
    stdout: 'piped',
  });
  const output = await cmd.output();
  if (!output.success) {
    const err = new TextDecoder().decode(output.stderr);
    throw new Error(err || 'deno info failed');
  }

  const text = new TextDecoder().decode(output.stdout);
  return Json.parse(text) as {
    modules?: Array<{ local?: string }>;
  };
}

function countLocalModules(info: { modules?: Array<{ local?: string }> }, packageDir: string) {
  return (info.modules ?? [])
    .flatMap((item) => item.local ? [item.local.replaceAll('\\', '/')] : [])
    .filter((local) => local.startsWith(packageDir))
    .length;
}
