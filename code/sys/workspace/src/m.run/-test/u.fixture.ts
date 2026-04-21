import { Fs, Str } from '../../-test.ts';

export async function writeWorkspace(cwd: string, args: { readonly failCheck: boolean }) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    workspace: ['code/pkg-a', 'code/pkg-b', 'code/pkg-c'],
  });

  await writePackage(cwd, 'code/pkg-a', {
    exports: { '.': './src/mod.ts' },
    tasks: {
      test: script("Deno.writeTextFileSync('../../run.log', 'test:pkg-a\\n', { append: true });"),
      check: script("Deno.writeTextFileSync('../../run.log', 'check:pkg-a\\n', { append: true });"),
      dry: script("Deno.writeTextFileSync('../../run.log', 'dry:pkg-a\\n', { append: true });"),
    },
    source: `export const a = 'a';\n`,
  });

  await writePackage(cwd, 'code/pkg-b', {
    exports: { '.': './src/mod.ts' },
    tasks: {
      check: args.failCheck
        ? script(
            "Deno.writeTextFileSync('../../run.log', 'check:pkg-b\\n', { append: true }); Deno.exit(1);",
          )
        : script("Deno.writeTextFileSync('../../run.log', 'check:pkg-b\\n', { append: true });"),
    },
    source: Str.dedent(`
      import { a } from '../../pkg-a/src/mod.ts';
      export const b = a;
    `),
  });

  await writePackage(cwd, 'code/pkg-c', {
    exports: { '.': './src/mod.ts' },
    tasks: {
      test: script("Deno.writeTextFileSync('../../run.log', 'test:pkg-c\\n', { append: true });"),
      check: script("Deno.writeTextFileSync('../../run.log', 'check:pkg-c\\n', { append: true });"),
      dry: script("Deno.writeTextFileSync('../../run.log', 'dry:pkg-c\\n', { append: true });"),
    },
    source: Str.dedent(`
      import { b } from '../../pkg-b/src/mod.ts';
      export const c = b;
    `),
  });
}

export async function readLog(cwd: string) {
  return String((await Fs.readText(Fs.join(cwd, 'run.log'))).data ?? '').replaceAll('\r\n', '\n');
}

async function writePackage(
  cwd: string,
  path: string,
  args: {
    readonly exports: Record<string, string>;
    readonly tasks: Record<string, string>;
    readonly source: string;
  },
) {
  await Fs.writeJson(Fs.join(cwd, path, 'deno.json'), {
    name: `@test/${Fs.Path.basename(path)}`,
    version: '1.0.0',
    exports: args.exports,
    tasks: args.tasks,
  });
  await Fs.write(Fs.join(cwd, path, 'src/mod.ts'), args.source);
}

function script(expr: string) {
  return `deno eval \"${expr.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}\"`;
}
