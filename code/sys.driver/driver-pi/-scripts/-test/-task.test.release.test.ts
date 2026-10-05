import { describe, expect, Fs, Is, it, type t } from '../common.ts';
import { runFrozenBrowser, runReleaseRuntime } from '../u.test.release.ts';

const DENY_WRITE =
  '--deny-write=./dist,./.pi,../../../.pi,./src/m.cli/m.profiles/u.start/u.gui/u.service.evidence.ts';
const DENY_NET = '--deny-net=0.0.0.0,127.0.0.1:8080';

describe('driver-pi/scripts/release proof launch', () => {
  it('runtime → exact sandbox, disposable environment, and child exit status', async () => {
    const calls: t.Process.InvokeArgs[] = [];
    const code = await runReleaseRuntime((input) => {
      calls.push(input);
      return Promise.resolve({ code: 17, success: false, signal: null });
    });
    expect(code).to.eql(17);
    expect(calls.length).to.eql(1);
    expect(calls[0].cmd).to.eql(Deno.execPath());
    expect(calls[0].args).to.eql([
      'test',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '-P=release-local-test',
      DENY_WRITE,
      '--deny-env=DENO_DIR',
      DENY_NET,
      '--deny-run',
      '--trace-leaks',
      './-scripts/-test.external/-task.start.gui.release.local.ts',
    ]);
    expect(calls[0].env).to.eql({ TMPDIR: './.tmp', FORCE_COLOR: '0' });
    expect(calls[0].clearEnv).to.eql(false);
    expect(calls[0].cwd).to.eql(Fs.Path.fromFileUrl(new URL('../../', import.meta.url)));
  });

  it('failed admission → no environment access or browser child', async () => {
    const calls: t.Process.InvokeArgs[] = [];
    const code = await runFrozenBrowser({
      inherit: (input) => {
        calls.push(input);
        return Promise.resolve({ code: 23, success: false, signal: null });
      },
      env: {
        get() {
          throw new Error('must not read Chrome after refusal');
        },
        delete() {
          throw new Error('must not mutate environment after refusal');
        },
      },
    });
    expect(code).to.eql(23);
    expect(calls.map((call) => call.args)).to.eql([[
      'run',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '-P=test-browser-admit',
      './-scripts/-test.browser.admit.ts',
    ]]);
  });

  it('admission or environment failure → preserves the exact failure without launching Chrome', async () => {
    for (const phase of ['admit', 'get', 'delete']) {
      const failure = new Error(`failed:${phase}`);
      let calls = 0;
      const result = await runFrozenBrowser({
        inherit() {
          calls++;
          if (phase === 'admit') return Promise.reject(failure);
          return Promise.resolve({ code: 0, success: true, signal: null });
        },
        env: {
          get() {
            if (phase === 'get') throw failure;
            return '/Applications/Chrome Test.app/Contents/MacOS/Chrome';
          },
          delete() {
            throw failure;
          },
        },
      }).catch((cause: unknown) => cause);
      expect(result).to.equal(failure);
      expect(calls).to.eql(1);
    }
  });

  it('missing Chrome after admission → refuses an empty run grant before environment mutation', async () => {
    for (const executable of [undefined, '']) {
      let calls = 0;
      const result = await runFrozenBrowser({
        inherit() {
          calls++;
          return Promise.resolve({ code: 0, success: true, signal: null });
        },
        env: {
          get: () => executable,
          delete() {
            throw new Error('must not mutate environment without Chrome');
          },
        },
      }).catch((cause: unknown) => cause);
      if (!Is.error(result)) throw new Error('Expected missing Chrome to reject.');
      expect(result.message).to.eql('Admitted Chrome executable is unavailable.');
      expect(calls).to.eql(1);
    }
  });

  it('admitted Chrome → sanitize before spawn and preserve one exact argv capability', async () => {
    const chrome = '/Applications/Chrome Test.app/Contents/MacOS/Chrome';
    const calls: t.Process.InvokeArgs[] = [];
    const events: string[] = [];
    const code = await runFrozenBrowser({
      inherit: (input) => {
        calls.push(input);
        events.push(calls.length === 1 ? 'admit' : 'browser');
        return Promise.resolve({
          code: calls.length === 1 ? 0 : 31,
          success: calls.length === 1,
          signal: null,
        });
      },
      env: {
        get(name) {
          events.push(`get:${name}`);
          return chrome;
        },
        delete(name) {
          events.push(`delete:${name}`);
        },
      },
    });
    expect(code).to.eql(31);
    expect(events).to.eql(['admit', 'get:CHROME_BIN', 'delete:CHROME_BIN', 'browser']);
    expect(calls[1].args).to.eql([
      'test',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '-P=test-browser-frozen',
      `--allow-run=${chrome}`,
      DENY_WRITE,
      '--deny-env=DENO_DIR',
      DENY_NET,
      '--trace-leaks',
      './-scripts/-test.browser.ts',
      '--',
      `--chrome-executable=${chrome}`,
    ]);
    expect(calls[1].env).to.eql({
      TMPDIR: './.tmp',
      FORCE_COLOR: '0',
      SYS_DRIVER_PI_RELEASE_EVIDENCE: '1',
    });
    expect(calls[1].clearEnv).to.eql(false);
    expect(calls[1].cmd).to.eql(Deno.execPath());
    expect(calls[1].cwd).to.eql(calls[0].cwd);
  });
});
