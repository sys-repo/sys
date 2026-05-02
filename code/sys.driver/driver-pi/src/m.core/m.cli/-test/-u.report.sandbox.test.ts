import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { PiSandboxReport } from '../u.report.sandbox.ts';

describe(`@sys/driver-pi/cli/u.report.sandbox`, () => {
  it('dir → derives the project log dir from the shared pi fs seam', () => {
    expect(PiSandboxReport.dir('/tmp/pi-cli-test')).to.eql('/tmp/pi-cli-test/.log/@sys.driver-pi');
  });

  it('fileOf → writes reports under the derived project log dir with timestamped markdown names', () => {
    const path = PiSandboxReport.fileOf('/tmp/pi-cli-test');
    expect(path).to.contain('/tmp/pi-cli-test/.log/@sys.driver-pi/');
    expect(path).to.match(/\/\d+\.[a-z0-9]+\.sandbox\.log\.md$/);
  });

  it('write → migrates legacy runtime log dir before writing the new report', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox.report.test.' }))
      .absolute as t.StringDir;
    const oldFile = Fs.join(cwd, '.log/@sys.driver-pi.pi/old.sandbox.log.md') as t.StringPath;
    const newFile = Fs.join(cwd, '.log/@sys.driver-pi/old.sandbox.log.md') as t.StringPath;

    try {
      await Fs.ensureDir(Fs.dirname(oldFile));
      await Fs.write(oldFile, '# old report\n');

      const written = await PiSandboxReport.write({ cwd, sandbox: sandboxOf(cwd) });
      expect(written).to.contain(`${cwd}/.log/@sys.driver-pi/`);
      expect(await Fs.exists(oldFile)).to.eql(false);
      expect((await Fs.readText(newFile)).data).to.eql('# old report\n');
      expect(await Fs.exists(written)).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('write → refuses legacy log migration conflicts without clobbering', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.sandbox.report.test.' }))
      .absolute as t.StringDir;
    const oldFile = Fs.join(cwd, '.log/@sys.driver-pi.pi/conflict.md') as t.StringPath;
    const newFile = Fs.join(cwd, '.log/@sys.driver-pi/conflict.md') as t.StringPath;

    try {
      await Fs.ensureDir(Fs.dirname(oldFile));
      await Fs.ensureDir(Fs.dirname(newFile));
      await Fs.write(oldFile, 'old\n');
      await Fs.write(newFile, 'new\n');

      let error: Error | undefined;
      try {
        await PiSandboxReport.write({ cwd, sandbox: sandboxOf(cwd) });
      } catch (err) {
        error = err as Error;
      }

      expect(error?.message).to.contain('Sandbox log migration would overwrite existing file');
      expect((await Fs.readText(oldFile)).data).to.eql('old\n');
      expect((await Fs.readText(newFile)).data).to.eql('new\n');
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('text → renders full markdown report sections without truncation', () => {
    const text = PiSandboxReport.text({
      cwd: '/tmp/pi-cli-test',
      sandbox: {
        permissions: 'scoped',
        cwd: { invoked: '/tmp/pi-cli-test/nested', git: '/tmp/pi-cli-test' },
        read: {
          summary: ['cwd', 'runtime'],
          detail: ['/tmp/pi-cli-test/.tmp/pi.cli/deno', '/bin/bash'],
        },
        write: {
          summary: ['cwd', 'temp'],
          detail: ['/var/tmp/pi'],
        },
        context: {
          include: ['/tmp/pi-cli-test/canon.md'],
        },
      },
    });

    expect(text).to.contain('# Pi Sandbox Report');
    expect(text).to.contain('- pkg: @sys/driver-pi@');
    expect(text).to.contain('## Summary');
    expect(text).to.contain('## Readable Paths');
    expect(text).to.contain('## Writable Paths');
    expect(text).to.contain('## Context Files');
    expect(text).to.contain('- permissions: scoped');
    expect(text).to.contain('- read: cwd + runtime');
    expect(text).to.contain('- write: cwd + tmp');
    expect(text).to.contain('- cwd.git: /tmp/pi-cli-test');
    expect(text).to.contain('- cwd.invoked: /tmp/pi-cli-test/nested');
    expect(text).to.contain('## Writable Paths\n- /tmp/pi-cli-test\n- /var/tmp/pi');
    expect(text).to.contain('- context: loaded context (wrapper-owned prompt)');
    expect(text).to.contain('- /tmp/pi-cli-test/canon.md');
    expect(text).to.contain('## Readable Paths\n- /tmp/pi-cli-test/.tmp/pi.cli/deno\n- /bin/bash');
  });

  it('text → records allow-all as the effective permission posture', () => {
    const text = PiSandboxReport.text({
      cwd: '/tmp/pi-cli-test',
      sandbox: {
        permissions: 'allow-all',
        cwd: { invoked: '/tmp/pi-cli-test', git: '/tmp/pi-cli-test' },
        read: { summary: ['cwd'], detail: ['/tmp/pi-cli-test/.tmp/pi.cli/deno'] },
        write: { summary: ['cwd'], detail: ['/tmp/pi-cli-test/out'] },
      },
    });

    expect(text).to.contain('- permissions: allow-all');
    expect(text).to.contain('- read: all');
    expect(text).to.contain('- write: all');
    expect(text).to.contain('## Readable Paths\n- all (Deno --allow-all)');
    expect(text).to.contain('## Writable Paths\n- all (Deno --allow-all)');
  });
});

function sandboxOf(cwd: t.StringDir): t.PiCli.SandboxSummary {
  return {
    permissions: 'scoped',
    cwd: { invoked: cwd, git: cwd },
    read: { summary: ['cwd'], detail: [cwd] },
    write: { summary: ['cwd'], detail: [] },
  };
}
