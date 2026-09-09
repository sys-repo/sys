import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { createTransport, expectFilesClientError, handlersWithMutations } from './u.fixture.ts';

describe('Files.Client.Handle: remove method', () => {
  it('lowers remove to a files:remove command', async () => {
    const seen: t.Files.Cmd.Remove.Payload[] = [];
    const setup = createTransport(
      handlersWithMutations({
        remove(payload) {
          seen.push(payload);
          return { kind: 'deleted', path: payload.path };
        },
      }),
    );

    try {
      const sloppyOptions = {
        path: 'ignored.js',
        recursive: true,
      } as unknown as t.Files.Client.Remove.Options;
      const result = await setup.files.remove('old/app.js', sloppyOptions);

      expect(result).to.eql({ kind: 'deleted', path: 'old/app.js' });
      expect(seen).to.eql([{ path: 'old/app.js', recursive: true }]);
    } finally {
      setup.dispose();
    }
  });

  it('wraps remove command failures without hiding the cause', async () => {
    const setup = createTransport(
      handlersWithMutations({
        remove() {
          throw new Error('remove denied by fixture');
        },
      }),
    );

    try {
      const error = await expectFilesClientError(
        () => setup.files.remove('secret.txt'),
        'Files.Client.remove: failed to remove "secret.txt"',
      );
      expect((error.cause as Error).name).to.eql('CmdError.Remote');
      expect((error.cause as Error).message).to.eql('remove denied by fixture');
    } finally {
      setup.dispose();
    }
  });

  it('keeps remove method types truthful', async () => {
    if (false) {
      const handle = undefined as unknown as t.Files.Client.Handle;
      const result = await handle.remove('old/app.js', { recursive: true });

      expectTypeOf(result).toEqualTypeOf<t.Files.Cmd.Remove.Result>();

      // @ts-expect-error remove path is the method argument, not an option field.
      handle.remove('old/app.js', { path: 'ignored.js' });
    }
  });
});
