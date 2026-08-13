import { expect, Fs, Is, Obj } from './common.ts';

type PermissionSet = { readonly run?: unknown };
type DenoConfig = {
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

Deno.test('Testing permission lanes → separate unit, fixture-process, and browser authority', async () => {
  const testing = await readConfig(Fs.join(ROOT_DIR, 'code/sys/testing/deno.json'));
  expect(testing.permissions?.['test-unit']?.run).to.eql(undefined);
  expect(testing.permissions?.['test-process']?.run).to.eql(['deno']);
  expect(testing.permissions?.['test-browser']?.run).to.eql(true);
});

/**
 * Helpers:
 */
async function readConfig(path: string): Promise<DenoConfig> {
  const result = await Fs.readJson<DenoConfig>(path);
  if (!result.ok) throw result.error;
  return result.data ?? {};
}
