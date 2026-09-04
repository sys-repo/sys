import { describe, expect, it } from '../../src/-test.ts';
import { default as deno } from '../../deno.json' with { type: 'json' };
import { Is } from '../m.start.gui.evidence.local/common.ts';

const SHELL_CHAIN_MARKERS = ['&&', '||', ';', '|', '>', '<', '&', '`', '$(', '\n'] as const;
const PROTECTED_WRITE_DENIAL =
  '--deny-write=./dist,./.pi,../../../.pi,./src/m.cli/m.profiles/u/u.start.gui.service.evidence.ts';
const PROTECTED_NET_DENIAL = '--deny-net=0.0.0.0,127.0.0.1:8080';

describe('driver-pi/scripts/task.start.gui.release.local', () => {
  it('keeps the local candidate outside package publication', () => {
    expect(deno.exclude).to.contain('dist');
  });

  it('pins least-authority evidence binding', () => {
    const permissions = deno.permissions as Record<string, Record<string, unknown>>;
    // Exact equality is intentional here: every added capability changes the security contract.
    expect(permissions['evidence-local']).to.eql({
      read: ['./dist'],
      write: ['./src/m.cli/m.profiles/u/u.start.gui.service.evidence.ts'],
    });
    expect(permissions['test-evidence-process']).to.eql({
      read: [
        './.tmp',
        './src/m.cli/m.profiles/u/u.start.gui.service.evidence.ts',
      ],
      write: [
        './.tmp',
        './src/m.cli/m.profiles/u/u.start.gui.service.evidence.ts',
      ],
      env: ['DENO_DIR', 'SystemRoot'],
      run: ['deno'],
    });
    expectTask(
      'bind:gui:evidence:local',
      [
        'deno run',
        '--frozen',
        '--cached-only',
        '--no-prompt',
        '-P=evidence-local',
        './-scripts/task.start.gui.evidence.local.ts',
      ],
      [...SHELL_CHAIN_MARKERS, '-A', '-R', '-W', '-E', '-N', '-S', '-F', '--allow-'],
    );
    expect((deno.tasks as Record<string, unknown>)['start:gui:evidence:local']).to.eql(undefined);
  });

  it('runs build before the exact binding leaf and stops when build fails', () => {
    expectTaskExact('bind:dev', [
      'deno task build',
      '&&',
      'deno task bind:gui:evidence:local',
    ]);
  });

  it('confines disposable runtime writes, wildcard bind, and fixed-port authority', () => {
    const permissions = deno.permissions as Record<string, Record<string, unknown>>;
    // Pinned verification observes the selected root's ancestor chain; writes stay disposable.
    expect(permissions['release-local-test']).to.eql({
      read: true,
      write: ['./.tmp'],
      env: ['FORCE_COLOR', 'NODE_DISABLE_COLORS', 'NO_COLOR', 'TERM', 'TERM_PROGRAM'],
      net: ['127.0.0.1'],
    });
    expectTask(
      'test:release:local:runtime',
      [
        'TMPDIR=./.tmp',
        'FORCE_COLOR=0',
        '-P=release-local-test',
        PROTECTED_WRITE_DENIAL,
        '--deny-env=DENO_DIR',
        PROTECTED_NET_DENIAL,
        '--deny-run',
      ],
      ['--allow-', ...SHELL_CHAIN_MARKERS],
    );
  });

  it('keeps current browser proof build-owning and freezes finite Chrome authority', () => {
    const permissions = deno.permissions as Record<string, Record<string, unknown>>;
    expect(permissions['test-browser']).to.eql({
      read: true,
      write: true,
      env: true,
      net: ['127.0.0.1', '0.0.0.0'],
      run: true,
    });
    expect(permissions['test-browser-admit']).to.eql({
      read: true,
      env: ['CHROME_BIN'],
    });
    expect(permissions['test-browser-frozen']).to.eql({
      read: true,
      write: ['./.tmp'],
      env: [
        'SYS_DRIVER_PI_RELEASE_EVIDENCE',
        'FORCE_COLOR',
        'NODE_DISABLE_COLORS',
        'NO_COLOR',
        'TERM',
        'TERM_PROGRAM',
      ],
      net: ['127.0.0.1'],
    });

    const entry = './-scripts/-test.browser.ts';
    const admitEntry = './-scripts/-test.browser.admit.ts';
    const current = expectTask('test:browser', ['deno task build', entry]);
    expect(current.indexOf('deno task build')).to.be.lessThan(current.indexOf(entry));
    expectTaskExact(
      'test:release:local:browser:admit',
      [
        'deno run',
        '--frozen',
        '--cached-only',
        '--no-prompt',
        '-P=test-browser-admit',
        admitEntry,
      ],
    );
    expectTaskExact(
      'test:release:local:browser:frozen',
      [
        'deno task test:release:local:browser:admit',
        '&&',
        'env -u CHROME_BIN',
        'TMPDIR=./.tmp',
        'FORCE_COLOR=0',
        'SYS_DRIVER_PI_RELEASE_EVIDENCE=1',
        'deno test',
        '--frozen',
        '--cached-only',
        '--no-prompt',
        '-P=test-browser-frozen',
        '--allow-run="$CHROME_BIN"',
        PROTECTED_WRITE_DENIAL,
        '--deny-env=DENO_DIR',
        PROTECTED_NET_DENIAL,
        '--trace-leaks',
        entry,
        '--',
        '--chrome-executable="$CHROME_BIN"',
      ],
    );
  });
});

function expectTaskExact(name: string, parts: readonly string[]) {
  expect((deno.tasks as Record<string, unknown>)[name]).to.eql(parts.join(' '));
}

function expectTask(
  name: string,
  required: readonly string[],
  forbidden: readonly string[] = [],
): string {
  const task = (deno.tasks as Record<string, unknown>)[name];
  if (!Is.string(task)) throw new Error(`Missing Driver Pi task: ${name}`);
  for (const marker of required) expect(task).to.contain(marker);
  for (const marker of forbidden) expect(task).not.to.contain(marker);
  return task;
}
