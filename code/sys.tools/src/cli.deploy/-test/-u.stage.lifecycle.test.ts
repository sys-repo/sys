import { describe, expect, expectError, Fs, it, Json, Path, Str, type t } from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { withTmpDir } from './u.fixture.ts';

const CONCURRENT_STAGE_CHILD = Path.fromFileUrl(
  new URL('./-u.stage.concurrent.process.ts', import.meta.url),
) as t.StringAbsolutePath;

type ConcurrentStageReport =
  | { readonly ok: true; readonly stagingRoot: t.StringAbsoluteDir }
  | { readonly ok: false; readonly error: string };

describe('@sys/tools/deploy public staging lifecycle', () => {
  it('serializes one mutable build source across distinct public cwd roots', async () => {
    await withTmpDir(async (tmp) => {
      const cwdA = `${tmp}/endpoint-a`;
      const cwdB = `${tmp}/endpoint-b`;
      const configDirA = `${cwdA}/-config/@sys.tools.deploy`;
      const configDirB = `${cwdB}/-config/@sys.tools.deploy`;
      const control = `${tmp}/control`;
      const builder = `${tmp}/builder`;
      await Fs.ensureDir(configDirA);
      await Fs.ensureDir(configDirB);
      await Fs.ensureDir(control);
      await Fs.ensureDir(builder);
      await Fs.write(
        `${builder}/-build.ts`,
        Str.dedent(`
          const variant = Deno.env.get('BUILD_VARIANT');
          if (variant !== 'A' && variant !== 'B') throw new Error('Expected build variant.');

          const control = '../control';
          const release = control + '/release-a';
          const exists = async (path: string) => {
            try {
              await Deno.stat(path);
              return true;
            } catch (error) {
              if (error instanceof Deno.errors.NotFound) return false;
              throw error;
            }
          };
          const waitForRelease = async () => {
            if (await exists(release)) return;
            const watcher = Deno.watchFs(control);
            try {
              if (await exists(release)) return;
              for await (const _event of watcher) {
                if (await exists(release)) return;
              }
            } finally {
              watcher.close();
            }
          };

          await Deno.remove('dist', { recursive: true }).catch(() => undefined);
          await Deno.mkdir('dist', { recursive: true });
          await Deno.writeTextFile('dist/variant.txt', variant);
          await Deno.writeTextFile(control + '/' + variant + '.built', variant);
          if (variant === 'A') await waitForRelease();
        `),
      );
      await Fs.write(
        `${builder}/deno.json`,
        Json.stringify({
          name: 'deploy-shared-builder',
          version: '0.0.0',
          tasks: {
            test: `deno eval "Deno.exit(0)"`,
            build: `deno run -A ./-build.ts`,
          },
        }),
      );

      const configA = `${configDirA}/stage.yaml`;
      const configB = `${configDirB}/stage.yaml`;
      await Fs.write(configA, buildEndpointYaml('./stage', tmp));
      await Fs.write(configB, buildEndpointYaml('./stage', tmp));

      const a = spawnConcurrentStage(cwdA, configA, 'A');
      await waitForPath(control, `${control}/A.built`);

      let bOutput: Deno.CommandOutput;
      try {
        bOutput = await runConcurrentStage(cwdB, configB, 'B');
      } finally {
        await Fs.write(`${control}/release-a`, 'release');
      }
      const aOutput = await a.output();
      const reportA = concurrentStageReport(aOutput);
      const reportB = concurrentStageReport(bOutput);

      expect(reportA.ok).to.eql(true);
      expect(reportB.ok).to.eql(false);
      if (reportB.ok) throw new Error('Expected the contending build to fail busy.');
      expect(reportB.error).to.include('build source is already owned');
      expect(await Fs.exists(`${control}/B.built`)).to.eql(false);
      expect((await Fs.readText(`${cwdA}/stage/variant.txt`)).data).to.eql('A');
      expect(await Fs.exists(`${cwdB}/stage/dist.json`)).to.eql(false);
    });
  });

  it('cancels a blocked build through public Deploy.stage before releasing its lease', async () => {
    await withTmpDir(async (cwd) => {
      const configDir = `${cwd}/-config/@sys.tools.deploy`;
      const builder = `${cwd}/builder`;
      const ready = `${builder}/build.ready`;
      const release = `${builder}/build.release`;
      const childLock = `${builder}/child.lock`;
      await Fs.ensureDir(configDir);
      await Fs.ensureDir(builder);
      await Fs.write(
        `${builder}/-build.ts`,
        Str.dedent(`
          const release = './build.release';
          const exists = async (path: string) => {
            try {
              await Deno.stat(path);
              return true;
            } catch (error) {
              if (error instanceof Deno.errors.NotFound) return false;
              throw error;
            }
          };
          const lock = await Deno.open('./child.lock', {
            create: true,
            read: true,
            write: true,
          });
          await lock.lock(true);
          try {
            await Deno.writeTextFile('./build.ready', 'ready');
            if (!await exists(release)) {
              const watcher = Deno.watchFs('.');
              try {
                if (!await exists(release)) {
                  for await (const _event of watcher) {
                    if (await exists(release)) break;
                  }
                }
              } finally {
                watcher.close();
              }
            }
            await Deno.mkdir('dist', { recursive: true });
            await Deno.writeTextFile('dist/value.txt', 'complete');
          } finally {
            await lock.unlock();
            lock.close();
          }
        `),
      );
      await Fs.write(
        `${builder}/deno.json`,
        Json.stringify({
          name: 'deploy-cancellable-builder',
          version: '0.0.0',
          tasks: {
            test: `deno eval "Deno.exit(0)"`,
            build: `deno run -A ./-build.ts`,
          },
        }),
      );
      const config = `${configDir}/stage.yaml`;
      await Fs.write(config, buildEndpointYaml('./stage'));

      const controller = new AbortController();
      const whenReady = waitForPath(builder, ready);
      const pending = Deploy.stage({ cwd, config, until: controller.signal });
      await whenReady;
      controller.abort('public staging cancellation');
      await expectError(() => pending, 'Cancelled build task');

      const lock = await Deno.open(childLock, { read: true, write: true });
      const acquired = await lock.tryLock(true);
      expect(acquired).to.eql(true);
      if (acquired) await lock.unlock();
      lock.close();
      expect(await Fs.exists(`${cwd}/stage/dist.json`)).to.eql(false);

      await Fs.write(release, 'release');
      const retried = await Deploy.stage({ cwd, config });
      expect(retried.verification.dist.hash.parts['value.txt']).to.not.eql(undefined);
    });
  });
});

function buildEndpointYaml(stagingRoot: string, sourceRoot = '.'): string {
  return Str.dedent(`
    source:
      dir: '${sourceRoot}'
    staging:
      dir: '${stagingRoot}'
    mappings:
      - mode: build+copy
        dir:
          source: ./builder
          staging: .
  `);
}

function spawnConcurrentStage(
  cwd: t.StringDir,
  config: t.StringPath,
  variant: 'A' | 'B',
): Deno.ChildProcess {
  return concurrentStageCommand(cwd, config, variant).spawn();
}

function runConcurrentStage(
  cwd: t.StringDir,
  config: t.StringPath,
  variant: 'A' | 'B',
): Promise<Deno.CommandOutput> {
  return concurrentStageCommand(cwd, config, variant).output();
}

function concurrentStageCommand(
  cwd: t.StringDir,
  config: t.StringPath,
  variant: 'A' | 'B',
): Deno.Command {
  return new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', '--quiet', CONCURRENT_STAGE_CHILD, cwd, config],
    cwd: Fs.cwd(),
    env: { BUILD_VARIANT: variant },
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  });
}

function concurrentStageReport(output: Deno.CommandOutput): ConcurrentStageReport {
  const decoder = new TextDecoder();
  const stderr = decoder.decode(output.stderr);
  if (!output.success || output.code !== 0 || stderr !== '') {
    throw new Error(`Concurrent staging child failed (${output.code}).\n${stderr}`);
  }
  return Json.parse(decoder.decode(output.stdout)) as ConcurrentStageReport;
}

async function waitForPath(root: t.StringDir, path: t.StringPath): Promise<void> {
  if (await Fs.exists(path)) return;
  const watcher = Deno.watchFs(root);
  try {
    if (await Fs.exists(path)) return;
    for await (const _event of watcher) {
      if (await Fs.exists(path)) return;
    }
  } finally {
    watcher.close();
  }
}
