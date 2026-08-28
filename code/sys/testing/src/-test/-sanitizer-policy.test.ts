import { expect, Fs, Is, Obj } from './common.ts';

type PermissionSet = {
  readonly run?: unknown;
  readonly write?: unknown;
  readonly env?: unknown;
};
type DenoConfig = {
  readonly tasks?: Record<string, unknown>;
  readonly test?: {
    readonly sanitizeOps?: unknown;
    readonly sanitizeResources?: unknown;
  };
  readonly permissions?: Record<string, PermissionSet>;
  readonly workspace?: readonly string[];
};

const ROOT_CONFIG = Fs.Path.fromFileUrl(new URL('../../../../../deno.json', import.meta.url));
const ROOT_DIR = Fs.Path.dirname(ROOT_CONFIG);

Deno.test('Workspace sanitizer policy → owns strict root keys only', async () => {
  const root = await readConfig(ROOT_CONFIG);
  expect(root.test?.sanitizeOps).to.eql(true);
  expect(root.test?.sanitizeResources).to.eql(true);

  const memberOverrides: string[] = [];
  const members = (root.workspace ?? []).filter(Is.string);
  for (const member of members) {
    const path = Fs.join(ROOT_DIR, member, 'deno.json');
    const config = await readConfig(path);
    const test = config.test;
    if (!test) continue;
    if (Obj.hasOwn(test, 'sanitizeOps') || Obj.hasOwn(test, 'sanitizeResources')) {
      memberOverrides.push(member);
    }
  }

  expect(memberOverrides).to.eql([]);
});

Deno.test('Testing permission lanes → separate unit, preparation, and Chrome authority', async () => {
  const testing = await readConfig(Fs.join(ROOT_DIR, 'code/sys/testing/deno.json'));
  const permissions = testing.permissions ?? {};

  expect(permissions['test-unit']?.run).to.eql(undefined);
  expect(permissions['test-process']?.run).to.eql(['deno']);
  expect(permissions['test-browser-preflight']).to.eql({
    read: true,
    write: ['./.tmp/browser-proof'],
    env: ['CHROME_BIN'],
  });
  expect(permissions['test-browser-unit']).to.eql({
    read: true,
    write: ['./.tmp/browser-proof'],
  });
  expect(permissions['test-browser-prepare']).to.eql({
    read: true,
    write: ['./.tmp/browser-proof'],
    run: ['deno'],
  });
  expect(permissions['test-browser-admit']).to.eql({
    read: true,
    env: ['CHROME_BIN'],
  });
  expect(permissions['test-browser-chrome']).to.eql({
    read: true,
    write: ['./.tmp/browser-proof'],
    env: ['TMPDIR'],
    net: ['127.0.0.1'],
  });
  expect(permissions['test-browser-postflight']).to.eql({
    read: ['./.tmp/browser-proof'],
    write: ['./.tmp/browser-proof'],
    run: ['/bin/ps', '/usr/bin/ps'],
  });

  expect(testing.tasks?.['test:browser:preflight']).to.eql(
    'deno run --no-prompt -P=test-browser-preflight -- ./scripts/task.browser.preflight.ts',
  );
  expect(testing.tasks?.['test:browser:unit']).to.eql(
    'TMPDIR=./.tmp/browser-proof deno test --no-prompt --deny-run ' +
      '-P=test-browser-unit --trace-leaks ' +
      './src/m.server/m.Browser/-test/-internal.test.ts ' +
      './src/m.server/m.Browser/-test/-u.chrome.executable.test.ts --',
  );
  expect(testing.tasks?.['test:browser:prepare']).to.eql(
    'TMPDIR=./.tmp/browser-proof deno run --no-prompt ' +
      '-P=test-browser-prepare -- ./scripts/task.browser.prepare.ts',
  );
  expect(testing.tasks?.['test:browser:admit']).to.eql(
    'deno run --no-prompt -P=test-browser-admit -- ./scripts/task.browser.admit.ts',
  );
  expect(testing.tasks?.['test:browser:postflight']).to.eql(
    'deno run --no-prompt -P=test-browser-postflight -- ./scripts/task.browser.postflight.ts',
  );
  expect(testing.tasks?.['test:browser']).to.eql(
    'deno task test:browser:preflight && deno task test:browser:unit && ' +
      'deno task test:browser:prepare && deno task test:browser:chrome && ' +
      'deno task test:browser:postflight',
  );
  expect(testing.tasks?.['test:browser:chrome']).to.eql(
    'deno task test:browser:admit && ' +
      'env -u CHROME_BIN TMPDIR=./.tmp/browser-proof deno test --no-prompt ' +
      '-P=test-browser-chrome --allow-run="$CHROME_BIN" --trace-leaks ' +
      './src/m.server/m.Browser/-test/-chrome.authority.process.test.ts ' +
      './src/m.server/m.Browser/-test/-m.Browser.load.test.ts ' +
      './src/m.server/m.Browser/-test/-m.Browser.ServiceWorker.test.ts -- ' +
      '--chrome-executable="$CHROME_BIN"',
  );
});

/**
 * Helpers:
 */
async function readConfig(path: string): Promise<DenoConfig> {
  const result = await Fs.readJson<DenoConfig>(path);
  if (!result.ok) throw result.error;
  return result.data ?? {};
}
