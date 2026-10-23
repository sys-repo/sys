import { describe, expect, it } from '../../../../-test.ts';
import { withTmpDir } from '../../../-test/u.fixture.ts';
import { R2Provider } from '../mod.ts';
import { filesHandle, r2Target, stageDist, type Write } from './u.fixture.ts';

// Synthetic diagnostics isolate publication policy; the sample exercises the SDK with mocked fetch.
describe('R2 Provider: remote manifest refusal', () => {
  const failures = [
    new Error('remote refusal', {
      cause: {
        name: 'R2RequestError',
        message: 'R2 stat failed.',
        data: { operation: 'stat', status: 403, code: 'AccessDenied' },
      },
    }),
    new Error('remote failure', {
      cause: {
        name: 'R2RequestError',
        message: 'R2 read failed.',
        data: { operation: 'read', status: 503, code: 'ServiceUnavailable' },
      },
    }),
    new Deno.errors.NotCapable('fixture runtime refusal'),
    Object.assign(new Error('fixture runtime refusal with an absence cause'), {
      name: 'PermissionDenied',
      cause: { name: 'FilesR2Error.NotFound', message: 'File not found: dist.json' },
    }),
  ];
  for (const failure of failures) {
    it(`${failure.message} → stop before writes/pruning, retain the cause, dispose once`, async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const writes: Write[] = [];
        const base = filesHandle({ writes });
        let reads = 0;
        let disposed = 0;
        const result = await R2Provider.push({
          cwd,
          target: r2Target(cwd, stagingDir),
          createFiles: () => ({
            ...base,
            cmd: {
              ...base.cmd,
              send() {
                reads++;
                return Promise.reject(failure);
              },
            },
            dispose() {
              disposed++;
            },
            list() {
              throw new Error('Pruning must not begin.');
            },
          }),
        });
        expect(result.ok).to.eql(false);
        if (result.ok) throw new Error('Expected publication refusal.');
        expect(result.error).to.equal(failure);
        expect(writes).to.eql([]);
        expect(reads).to.eql(1);
        expect(disposed).to.eql(1);
      });
    });
  }
});
