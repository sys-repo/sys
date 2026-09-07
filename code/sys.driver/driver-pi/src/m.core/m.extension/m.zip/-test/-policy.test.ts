import { describe, expect, it } from '../../../../-test.ts';
import { Fs } from '@sys/fs';
import { capturePath, guardFailure, guardSource, isGuardFailure } from '../u/u.guard.ts';
import { resolvePolicy } from '../u/u.policy.ts';
import { toPromptArgs } from '../u/u.prompt.ts';

describe('Pi: ZIP policy', () => {
  it('fixed policy → exposes only the agreed finite read-tool bounds', async () => {
    const policy = await resolvePolicy({ readRoots: [], protectedRoots: [] });
    expect(policy.enabled).to.eql(true);
    expect(policy.readRoots).to.eql([]);
    expect(policy.protectedRoots).to.eql([]);
    expect(policy.operationTimeoutMs).to.eql(120_000);
    expect(policy.snapshotMaxBytes).to.eql(67_108_864);
    expect(policy.maxArgumentChars).to.eql(4_096);
    expect(policy.maxDisplayChars).to.eql(60_000);
    expect(policy.maxErrorChars).to.eql(16_000);
    expect(policy.zipLimits).to.eql({
      maxSourceBytes: 67_108_864,
      maxEntries: 2_048,
      maxTreeEntries: 8_192,
      maxPathBytes: 512,
      maxPathDepth: 32,
      maxEntryBytes: 134_217_728,
      maxExpandedBytes: 536_870_912,
      maxErrorChars: 16_000,
    });
    expect(Object.isFrozen(policy)).to.eql(true);
    expect(Object.isFrozen(policy.zipLimits)).to.eql(true);
  });

  it('absent roots → retain lexical scope without creating roots or canonical evidence', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'pi.zip.policy.' })).absolute;
    const absent = Fs.join(cwd, 'not-created');
    try {
      const policy = await resolvePolicy({ readRoots: [absent], protectedRoots: [] });
      expect(policy.readRoots.map((root) => root.path)).to.eql([absent]);
      expect(policy.readRoots[0].real).to.eql(undefined);
      expect(policy.readRoots[0].identity).to.eql(undefined);
      expect(await Fs.exists(absent)).to.eql(false);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('prompt → appends only when enabled and reports fixed runtime limits', async () => {
    const policy = await resolvePolicy({ readRoots: [], protectedRoots: [] });
    const [flag, text] = toPromptArgs(policy);
    expect(flag).to.eql('--append-system-prompt');
    expect(toPromptArgs({ ...policy, enabled: false })).to.eql([]);
    expect(text).to.include('callable only when selected by the live Pi launch');
    expect(text).to.include('live tool list and Pi selection are authoritative');
    expect(text).not.to.include('Available additional tools:');
    expect(text).to.include(`${policy.zipLimits.maxSourceBytes / 1_048_576} MiB source`);
    expect(text).to.include(`${policy.zipLimits.maxEntries} entries`);
    expect(text).to.include(`${policy.zipLimits.maxEntryBytes / 1_048_576} MiB per file`);
    expect(text).to.include(`${policy.zipLimits.maxExpandedBytes / 1_048_576} MiB total expansion`);
    expect(text).to.include(`${policy.maxDisplayChars} display characters`);
    expect(text).to.include(
      `${policy.operationTimeoutMs / 1_000} seconds cooperative operation budget`,
    );
  });

  it('argument capture → rejects traps and hidden fields before filesystem work', () => {
    let calls = 0;
    const accessor = {
      get path() {
        calls++;
        return 'a.zip';
      },
    };
    const proxy = new Proxy({ path: 'a.zip' }, {
      ownKeys() {
        calls++;
        throw new Error('trap');
      },
      getPrototypeOf() {
        calls++;
        throw new Error('trap');
      },
    });
    const hidden = Object.defineProperty({ path: 'a.zip' }, 'hidden', { value: 1 });
    for (const input of [accessor, proxy, hidden, { path: 'a.zip', [Symbol()]: 1 }]) {
      expect(() => capturePath(input, 4_096)).to.throw();
    }
    expect(calls).to.eql(0);
    for (
      const path of ['', ' ', '~/a.zip', '../a.zip', 'a/*.zip', 'a.zip\n', 'a\u001b.zip', 'a.tar']
    ) {
      expect(() => capturePath({ path }, 4_096)).to.throw();
    }
    expect(capturePath({ path: 'a.ZIP' }, 5)).to.eql('a.ZIP');
    expect(() => capturePath({ path: 'a.ZIP' }, 4)).to.throw('argument limit');
  });

  it('guard failures → authenticate identity rather than filesystem error text', () => {
    const owned = guardFailure('source is missing');
    expect(isGuardFailure(owned)).to.eql(true);
    expect(Object.isFrozen(owned)).to.eql(true);
    expect(isGuardFailure(new Error(owned.message))).to.eql(false);
    expect(isGuardFailure(new Proxy(owned, {}))).to.eql(false);
  });

  it('source guard → admits regular files and refuses reserved prefixes, aliases, and symlinks', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.zip.guard.' })).absolute;
    const source = Fs.join(root, 'a.zip');
    const protectedDir = Fs.join(root, 'private');
    try {
      await Fs.write(source, '', { throw: true });
      await Fs.ensureDir(protectedDir);
      const policy = await resolvePolicy({ readRoots: [root], protectedRoots: [protectedDir] });
      const guarded = await guardSource(root, 'a.zip', policy, () => {});
      expect(guarded).to.eql({ requested: 'a.zip', resolved: source, root });
      for (
        const name of ['.git', '.GIT', '.pi', '.PI', '.sys.rooted', '.SyS.RoOtEd-lease', 'private']
      ) {
        await Fs.write(Fs.join(root, name, 'a.zip'), '', { throw: true });
        await expectRefusal(
          () => guardSource(root, `${name}/a.zip`, policy, () => {}),
          'protected',
        );
      }
      await Fs.ensureSymlink(source, Fs.join(root, 'alias.zip'));
      await expectRefusal(() => guardSource(root, 'alias.zip', policy, () => {}));
      await Fs.ensureSymlink(root, Fs.join(root, 'alias'));
      await expectRefusal(() => guardSource(root, 'alias/a.zip', policy, () => {}));
      await expectRefusal(() => guardSource('relative', 'a.zip', policy, () => {}));
      const identity = await resolvePolicy({ readRoots: [root], protectedRoots: [source] });
      await expectRefusal(() => guardSource(root, 'a.zip', identity, () => {}));
    } finally {
      await Fs.remove(root);
    }
  });
});

async function expectRefusal(run: () => Promise<unknown>, reason?: string) {
  let rejected = false;
  try {
    await run();
  } catch (error) {
    rejected = true;
    expect(isGuardFailure(error)).to.eql(true);
    if (reason && isGuardFailure(error)) expect(error.message).to.include(reason);
  }
  expect(rejected).to.eql(true);
}
