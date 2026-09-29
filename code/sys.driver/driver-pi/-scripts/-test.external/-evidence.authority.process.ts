import { expect } from '@sys/testing';
import deno from '../../deno.json' with { type: 'json' };
import { pkg } from '../../src/pkg.ts';
import { Fs, FsDist, Is, Json, stripAnsi } from '../m.start.gui.evidence.local/common.ts';
import { EVIDENCE, renderEvidence } from '../m.start.gui.evidence.local/mod.ts';

const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');
const TMP = Fs.join(PACKAGE_ROOT, '.tmp');
const ENTRY = Fs.Path.fromFileUrl(new URL('./-evidence.authority.child.ts', import.meta.url));
const RETAINED = 'retained disposable evidence\n';
const OTHER = { name: '@other/gui', version: '1.0.0' };

Deno.test('Driver Pi local evidence: candidate-only authority', async (test) => {
  expect(deno.permissions['evidence-local']).to.eql({
    read: ['./dist'],
    write: [`./${EVIDENCE.outputPath}`],
  });
  const denoDir = await resolveDenoDir();
  const systemRoot = Deno.build.os === 'windows' ? Deno.env.get('SystemRoot') : undefined;
  const env = { DENO_DIR: denoDir, ...(systemRoot ? { SystemRoot: systemRoot } : {}) };
  await Fs.ensureDir(TMP);
  const temporary = await Fs.makeTempDir({ dir: TMP, prefix: 'pi.evidence.authority.' });
  const root = await Fs.realPath(temporary.absolute);
  try {
    for (const kind of ['matching', 'changed', 'unlisted', 'missing', 'mismatching'] as const) {
      await test.step(kind, async () => {
        const dir = Fs.join(root, kind, 'dist');
        const output = Fs.join(root, kind, 'evidence.ts');
        const declaration = Fs.join(dir, 'pkg/-pkg.json');
        await Fs.ensureDir(dir);
        await Deno.writeTextFile(Fs.join(dir, 'index.html'), '<h1>local evidence</h1>');
        if (kind !== 'unlisted' && kind !== 'missing') {
          await Fs.write(declaration, Json.stringify(kind === 'mismatching' ? OTHER : pkg));
        }
        const computed = await FsDist.compute({ dir, pkg, save: true });
        if (computed.kind !== 'computed') throw computed.error;
        if (kind === 'changed' || kind === 'unlisted') {
          await Fs.write(declaration, Json.stringify(kind === 'changed' ? OTHER : pkg));
        }
        await Deno.writeTextFile(output, RETAINED);

        // Relocate the exact evidence-local grant shape to disposable paths, not source evidence.
        const args = [
          'run',
          '--check',
          '--frozen',
          '--cached-only',
          '--no-prompt',
          `--allow-read=${dir}`,
          `--allow-write=${output}`,
          ENTRY,
          dir,
          output,
        ];
        expect(args.filter((arg) => arg.startsWith('--allow-'))).to.eql([
          `--allow-read=${dir}`,
          `--allow-write=${output}`,
        ]);
        const result = await new Deno.Command(Deno.execPath(), {
          cwd: PACKAGE_ROOT,
          args,
          clearEnv: true,
          env,
          stdout: 'piped',
          stderr: 'piped',
        }).output();
        const stdout = stripAnsi(new TextDecoder().decode(result.stdout));
        const stderr = new TextDecoder().decode(result.stderr);
        if (kind === 'matching') {
          expect(result.success, stderr).to.eql(true);
          expect(await Deno.readTextFile(output)).to.eql(renderEvidence({
            manifestUrl: 'http://localhost:8080/dist.json',
            pin: computed.pin,
            expectedPkg: pkg,
          }));
          expect(stdout).to.contain(EVIDENCE.outputPath);
          expect(stdout).to.contain(EVIDENCE.commitMessage);
        } else {
          expect(result.success).to.eql(false);
          expect(stderr).to.contain(
            kind === 'changed' || kind === 'unlisted'
              ? 'Driver Pi local GUI Dist verification failed:'
              : 'Driver Pi local GUI Dist package mismatch:',
          );
          expect(await Deno.readTextFile(output)).to.eql(RETAINED);
          expect(stdout).to.eql('');
        }
      });
    }
  } finally {
    await Fs.remove(root);
  }
});

/** Match the existing evidence process lane: hand off the cache, not ambient terminal settings. */
async function resolveDenoDir(): Promise<string> {
  const configured = Deno.env.get('DENO_DIR');
  if (configured) return Fs.resolve(configured);
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['info', '--json'],
    cwd: PACKAGE_ROOT,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
  const info = Json.parse<unknown>(new TextDecoder().decode(result.stdout));
  if (!Is.record(info) || !Is.string(info.denoDir) || !Fs.Path.Is.absolute(info.denoDir)) {
    throw new Error('Expected the effective Deno cache directory.');
  }
  return info.denoDir;
}
