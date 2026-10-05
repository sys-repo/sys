import { build } from 'vite';
import { describe, expect, Fs, Is, it, Try } from '../../../-test.ts';
import { createFixture, expectWritten, readBuiltHtml } from './u.fixture.ts';

const ATTRIBUTES = [
  { name: 'integrity', reason: 'integrity' },
  { name: 'crossorigin', reason: 'crossorigin' },
  { name: 'src', reason: 'missing resource URL' },
  { name: 'href', reason: 'missing resource URL' },
] as const;

// These controls test the proof helper, not production HTML parsing or browser enforcement.
describe('HTML integrity → fixture proof reliability', () => {
  for (const { name, reason } of ATTRIBUTES) {
    it(`${name} → data-${name} is not an effective resource attribute`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      await build(config);
      await expectWritten(root, './');

      const html = await readBuiltHtml(root);
      const attribute = new RegExp(`([\\t\\n\\f\\r ])${name}(?=[\\t\\n\\f\\r =>])`, 'g');
      const mutated = html.replaceAll(attribute, `$1data-${name}`);
      expect(mutated).not.to.eql(html);
      const path = Fs.join(root, 'dist/nested/index.html');
      await Fs.write(path, mutated, { throw: true });
      const { result } = await Try.run(() => expectWritten(root, './'));
      if (result.ok) throw new Error(`expected ineffective ${name} refusal`);
      expect(result.error.message).to.include(reason);

      await Fs.write(path, html, { throw: true });
      await expectWritten(root, './');
    });
  }

  it('setup write failure → original error after awaited cleanup', async () => {
    const failure = new Error('fixture: injected setup write failure');
    const write = Deno.writeTextFile;
    const remove = Deno.remove;
    const cleanupStarted = Promise.withResolvers<void>();
    const allowCleanup = Promise.withResolvers<void>();
    let root: string | undefined;
    let settled = false;

    // Fault the underlying write so the real Fs.write error policy is exercised.
    Deno.writeTextFile = (path) => {
      if (!Is.str(path)) throw new Error('fixture: expected a normalized write path');
      root ??= Fs.resolve(path, '..', '..');
      return Promise.reject(failure);
    };
    Deno.remove = async (path, options) => {
      if (path === root) {
        cleanupStarted.resolve();
        await allowCleanup.promise;
      }
      await remove(path, options);
    };
    const setup = observeSetup().finally(() => {
      settled = true;
    });

    try {
      // A premature result must fail, not leave this test waiting for cleanup forever.
      await Promise.race([
        cleanupStarted.promise,
        setup.then(() => {
          throw new Error('fixture: setup settled before cleanup');
        }),
      ]);
      if (!Is.str(root)) throw new Error('fixture: no setup write reached the fault');
      expect(await Fs.exists(root)).to.eql(true);
      expect(settled, 'setup must remain unsettled while cleanup is blocked').to.eql(false);
      allowCleanup.resolve();
      expect(await setup).to.equal(failure);
      expect(await Fs.exists(root)).to.eql(false);
    } finally {
      allowCleanup.resolve();
      await setup;
      Deno.writeTextFile = write;
      Deno.remove = remove;
    }
  });
});

/** Own even an erroneously successful fixture so the red control leaves no temporary project. */
async function observeSetup(): Promise<unknown> {
  try {
    await using fixture = await createFixture();
    return fixture.root;
  } catch (error) {
    return error;
  }
}
