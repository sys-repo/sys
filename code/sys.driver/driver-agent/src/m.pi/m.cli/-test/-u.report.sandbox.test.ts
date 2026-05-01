import { describe, expect, it } from '../../../-test.ts';
import { PiSandboxReport } from '../u.report.sandbox.ts';

describe(`@sys/driver-agent/pi/cli/u.report.sandbox`, () => {
  it('dir → derives the project log dir from the shared pi fs seam', () => {
    expect(PiSandboxReport.dir('/tmp/pi-cli-test')).to.eql(
      '/tmp/pi-cli-test/.log/@sys.driver-agent.pi',
    );
  });

  it('fileOf → writes reports under the derived project log dir with timestamped markdown names', () => {
    const path = PiSandboxReport.fileOf('/tmp/pi-cli-test');
    expect(path).to.contain('/tmp/pi-cli-test/.log/@sys.driver-agent.pi/');
    expect(path).to.match(/\/\d+\.[a-z0-9]+\.sandbox\.log\.md$/);
  });

  it('text → renders full markdown report sections without truncation', () => {
    const text = PiSandboxReport.text({
      cwd: '/tmp/pi-cli-test',
      sandbox: {
        permissions: 'scoped',
        cwd: { invoked: '/tmp/pi-cli-test/nested', git: '/tmp/pi-cli-test' },
        read: {
          summary: ['cwd', 'runtime', 'context'],
          detail: ['/tmp/pi-cli-test/.tmp/pi.cli/deno', '/bin/bash'],
        },
        write: {
          summary: ['cwd', 'temp'],
          detail: ['/var/tmp/pi'],
        },
        context: {
          agents: 'walk-up',
          detail: ['/tmp/pi-cli-test/AGENTS.md'],
          include: ['/tmp/pi-cli-test/canon.md'],
        },
      },
    });

    expect(text).to.contain('# Pi Sandbox Report');
    expect(text).to.contain('- pkg: @sys/driver-agent@');
    expect(text).to.contain('## Summary');
    expect(text).to.contain('## Readable Paths');
    expect(text).to.contain('## Writable Paths');
    expect(text).to.contain('## Context Files');
    expect(text).to.contain('- permissions: scoped');
    expect(text).to.contain('- read: cwd + runtime + context');
    expect(text).to.contain('- write: cwd + tmp');
    expect(text).to.contain('- cwd.git: /tmp/pi-cli-test');
    expect(text).to.contain('- cwd.invoked: /tmp/pi-cli-test/nested');
    expect(text).to.contain('## Writable Paths\n- /tmp/pi-cli-test\n- /var/tmp/pi');
    expect(text).to.contain('- /tmp/pi-cli-test/AGENTS.md');
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
