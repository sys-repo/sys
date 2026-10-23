import { describe, expect, Fs, Is, it, Process } from '../../-test.ts';
import { Fmt } from '../../-tests/u.ts';
import { TmplTesting } from '../mod.ts';
import {
  poisonVersions,
  readAuthorityFiles,
  readWorkspaceAuthorities,
  runRepoCi,
  writePkg,
  writePkgHelp,
} from './u.fixture.ts';

type DenoJson = {
  readonly name?: string;
  readonly tasks?: Record<string, string>;
};

describe('m.testing/LocalRepoFixture/pkg', () => {
  it('create → compose foo/help + bar importing foo → restore authorities → package + repo pass', async () => {
    console.info(Fmt.slowRepoWorkspaceNote());
    const captured = await captureInfoAndWarn(() =>
      TmplTesting.LocalRepoFixture.create({ silent: true })
    );
    const fixture = captured.value;
    const initialFiles = await readAuthorityFiles(fixture.root);
    const workspaceAuthorities = await readWorkspaceAuthorities();

    expect(captured.info).to.eql([]);
    expect(captured.warn).to.eql([]);
    expect(await Fs.exists(Fs.join(fixture.root, 'deno.json'))).to.eql(true);
    expect(initialFiles.imports.imports).to.eql(fixture.authorities.imports);
    expect(initialFiles.packageJson).to.eql(fixture.authorities.packageJson);

    const fooDir = await writePkg(fixture.root, 'code/packages/foo', '@tmp/foo');
    const fooDenoJson = await readJson<DenoJson>(Fs.join(fooDir, 'deno.json'));
    expect(fooDenoJson.name).to.eql('@tmp/foo');
    expect(fooDenoJson.tasks?.build).to.eql(
      'deno run -A ./-scripts/task.vite.ts --cmd=build --in=./src/index.html',
    );
    expect(fooDenoJson.tasks?.deploy).to.eql(undefined);

    await writePkgHelp(fooDir);
    const fooHelpDenoJson = await readJson<DenoJson>(Fs.join(fooDir, 'deno.json'));
    expect(fooHelpDenoJson.tasks?.prep).to.eql('deno task help:bundle');
    expect(fooHelpDenoJson.tasks?.['help:bundle']).to.eql(
      'deno run -RWE ./src/m.help/-bundle/mod.ts',
    );
    expect(await Fs.exists(Fs.join(fooDir, 'src/m.help/yaml/root.yaml'))).to.eql(true);
    const helpBundleJson = await readJson<Record<string, string>>(
      Fs.join(fooDir, 'src/m.help/-bundle/-bundle.json'),
    );
    expect(Is.str(helpBundleJson['yaml/root.yaml'])).to.eql(true);

    const barDir = await writePkg(fixture.root, 'code/packages/bar', '@tmp/bar');

    await Fs.write(
      Fs.join(fooDir, 'src', 'mod.ts'),
      `export type Foo = {
  count: number;
  inc(): number;
};

export const MyFoo: Foo = {
  count: 123,
  inc: () => MyFoo.count + 1,
};
`,
    );

    await Fs.write(
      Fs.join(barDir, 'src', 'mod.ts'),
      `import { MyFoo, type Foo } from '@tmp/foo';

export const MyBar: Foo = {
  count: MyFoo.count + 1,
  inc: () => MyFoo.count + 2,
};
`,
    );

    await Fs.write(
      Fs.join(barDir, 'src', '-test', '-.test.ts'),
      `import { describe, expect, it } from '../-test.ts';
import { MyBar } from '../mod.ts';
import { MyFoo } from '@tmp/foo';

describe('module: @tmp/bar', () => {
  it('imports @tmp/foo across workspace packages', () => {
    expect(MyFoo.inc()).to.eql(124);
    expect(MyBar.count).to.eql(124);
    expect(MyBar.inc()).to.eql(125);
  });
});
`,
    );

    const expectedAuthorities = await TmplTesting.LocalRepoAuthorities.rewrite({
      root: fixture.root,
    });
    const expectedFiles = await readAuthorityFiles(fixture.root);
    expect(expectedFiles.imports.imports).to.eql(expectedAuthorities.imports);
    expect(expectedFiles.packageJson).to.eql(expectedAuthorities.packageJson);

    await poisonVersions(fixture.root);
    const poisonedFiles = await readAuthorityFiles(fixture.root);
    expect(poisonedFiles.imports.imports['@sys/std']).to.eql('jsr:@sys/std@999.0.0');
    expect(poisonedFiles.imports.imports['@sys/tmpl']).to.eql('jsr:@sys/tmpl@999.0.0');
    expect(poisonedFiles.imports.imports.react).to.eql('npm:react@0.0.1');
    expect(poisonedFiles.imports.imports['react-icons/vsc']).to.eql(
      'npm:react-icons@0.0.1/vsc',
    );
    expect(poisonedFiles.packageJson.dependencies?.react).to.eql('0.0.1');
    expect(poisonedFiles.packageJson.devDependencies?.vite).to.eql('0.0.1');

    const restored = await TmplTesting.LocalRepoAuthorities.rewrite({ root: fixture.root });
    expect(restored.imports['@sys/std']).to.eql(workspaceAuthorities.imports['@sys/std']);
    expect(restored.imports['@sys/tmpl']).to.eql(workspaceAuthorities.imports['@sys/tmpl']);
    expect(restored.imports.react).to.eql(workspaceAuthorities.imports.react);
    expect(restored.imports['react-icons/vsc']).to.eql(
      workspaceAuthorities.imports['react-icons/vsc'],
    );
    expect(restored.packageJson.dependencies?.react).to.eql(
      workspaceAuthorities.packageVersions.react,
    );
    expect(restored.packageJson.devDependencies?.vite).to.eql(
      workspaceAuthorities.packageVersions.vite,
    );
    const restoredFiles = await readAuthorityFiles(fixture.root);
    expect(restoredFiles.imports.imports).to.eql(restored.imports);
    expect(restoredFiles.packageJson).to.eql(restored.packageJson);

    const bundle = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'help:bundle'],
      cwd: fooDir,
      silent: true,
    });
    expect(bundle.success).to.eql(true, commandError('help:bundle', bundle));

    const packageCheck = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'check'],
      cwd: fooDir,
      silent: true,
    });
    expect(packageCheck.success).to.eql(true, commandError('package check', packageCheck));

    const crossPackage = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'test'],
      cwd: barDir,
      silent: true,
    });
    expect(crossPackage.success).to.eql(
      true,
      commandError('cross-package test', crossPackage),
    );

    const ci = await runRepoCi(fixture.root);
    if (!ci.success) {
      throw new Error(
        `Localized repo fixture foo/bar ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });
});

async function captureInfoAndWarn<T>(run: () => Promise<T>) {
  const original = { info: console.info, warn: console.warn } as const;
  const calls = {
    info: [] as unknown[][],
    warn: [] as unknown[][],
  };

  console.info = (...args: unknown[]) => {
    calls.info.push(args);
  };
  console.warn = (...args: unknown[]) => {
    calls.warn.push(args);
  };

  try {
    const value = await run();
    return { value, info: calls.info, warn: calls.warn } as const;
  } finally {
    console.info = original.info;
    console.warn = original.warn;
  }
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson<T>(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data;
}

type CommandResult = Awaited<ReturnType<typeof Process.invoke>>;

function commandError(label: string, res: CommandResult): string {
  return `${label} failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`;
}
