import { describe, expect, Fs, it, pkg } from '../../../../-test.ts';
import { DeploymentNote, FILE } from '../-tmpl.note/mod.ts';

describe('DenoDeploy.stage deployment note', () => {
  it('writes a self-describing staged deployment note and rewrites phase status', async () => {
    const pkgDir = await Fs.makeTempDir({ prefix: 'driver-deno.note.pkg.' });
    const distDir = Fs.join(pkgDir.absolute, 'dist');
    await Fs.ensureDir(distDir);
    await Fs.write(Fs.join(distDir, 'index.html'), '<!doctype html>', { force: true });

    const stageRoot = await Fs.makeTempDir({ prefix: 'driver-deno.note.root.' });
    let note = await DeploymentNote.create({
      name: '@tmp/foo',
      version: '0.0.1',
      sourcePackage: pkgDir.absolute,
      stageRoot: stageRoot.absolute,
    });

    await DeploymentNote.write(stageRoot.absolute, note);
    note = DeploymentNote.buildStarted(note);
    note = await DeploymentNote.buildDone(note, {
      pkgDir: pkgDir.absolute,
      elapsed: 1500,
    });
    note = DeploymentNote.stageStarted(note);
    await Fs.write(Fs.join(stageRoot.absolute, 'entry.ts'), 'export default 1;\n', { force: true });
    note = await DeploymentNote.stageDone(note, {
      stageRoot: stageRoot.absolute,
      elapsed: 4200,
    });
    note = DeploymentNote.prepareStarted(note);
    note = DeploymentNote.prepareDone(note, { elapsed: 250 });
    note = DeploymentNote.deployStarted(note);
    note = DeploymentNote.deployDone(note, {
      elapsed: 12_000,
      revision: 'https://console.deno.com/org/app/builds/abc',
      preview: 'https://app-abc.deno.net',
      verify: false,
    });
    await DeploymentNote.write(stageRoot.absolute, note);

    const text = (await Fs.readText(Fs.join(stageRoot.absolute, FILE))).data ?? '';
    expect(text).to.include('- name: `@tmp/foo`');
    expect(text).to.include('- version: `0.0.1`');
    expect(text).to.include('- source package:');
    expect(text).to.include('- stage root:');
    expect(text).to.include(`- builder: \`@sys/driver-deno@${pkg.version}/cloud: DenoDeploy\``);
    expect(text).to.include('This is a snapshot, not the original workspace package.');
    expect(text).to.include('- created: `');
    expect(text).to.include('` ✅');
    expect(text).to.include('- build: `ok` ✅');
    expect(text).to.include('  - bundle size: `');
    expect(text).to.include('- stage: `ok` ✅');
    expect(text).to.include('  - staged size (excluding node_modules): `');
    expect(text).to.include('- prepare: `ok` ✅');
    expect(text).to.include('- deploy: `ok` ✅');
    expect(text).to.include('  - revision: `https://console.deno.com/org/app/builds/abc`');
    expect(text).to.include('  - preview: `https://app-abc.deno.net`');
    expect(text).to.include('- verify: `pending`');
  });
});
