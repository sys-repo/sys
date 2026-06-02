import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { createTransport, expectFilesClientError, handlersWithMutations } from './u.fixture.ts';

describe('Files.Client.Handle: write methods', () => {
  it('lowers writeText to a complete text files:write command', async () => {
    const seen: t.Files.Cmd.Write.Payload[] = [];
    const setup = createTransport(
      handlersWithMutations({
        write(payload) {
          seen.push(payload);
          return { kind: 'created', path: payload.path };
        },
      }),
    );

    try {
      const sloppyOptions = {
        kind: 'bytes',
        path: 'ignored.txt',
        content: new Uint8Array([1]),
        encoding: 'utf8',
        mediaType: 'text/html',
      } as unknown as t.Files.Client.WriteTextOptions;
      const result = await setup.files.writeText('index.html', '<h1>Hello</h1>', sloppyOptions);

      expect(result).to.eql({ kind: 'created', path: 'index.html' });
      expect(seen).to.eql([
        {
          kind: 'text',
          path: 'index.html',
          content: '<h1>Hello</h1>',
          encoding: 'utf8',
          mediaType: 'text/html',
        },
      ]);
    } finally {
      setup.dispose();
    }
  });

  it('lowers writeBytes to a complete bytes files:write command', async () => {
    const seen: t.Files.Cmd.Write.Payload[] = [];
    const setup = createTransport(
      handlersWithMutations({
        write(payload) {
          seen.push(payload);
          return { kind: 'modified', path: payload.path };
        },
      }),
    );

    try {
      const bytes = new Uint8Array([0, 1, 2, 255]);
      const sloppyOptions = {
        kind: 'text',
        path: 'ignored.bin',
        content: 'ignored',
        mediaType: 'application/wasm',
      } as unknown as t.Files.Client.WriteBytesOptions;
      const result = await setup.files.writeBytes('assets/app.wasm', bytes, sloppyOptions);

      expect(result).to.eql({ kind: 'modified', path: 'assets/app.wasm' });
      expect(seen).to.eql([
        {
          kind: 'bytes',
          path: 'assets/app.wasm',
          content: bytes,
          mediaType: 'application/wasm',
        },
      ]);
    } finally {
      setup.dispose();
    }
  });

  it('wraps writeText command failures without hiding the cause', async () => {
    const setup = createTransport(
      handlersWithMutations({
        write() {
          throw new Error('write denied by fixture');
        },
      }),
    );

    try {
      const error = await expectFilesClientError(
        () => setup.files.writeText('secret.txt', 'nope'),
        'Files.Client.writeText: failed to write "secret.txt"',
      );
      expect((error.cause as Error).name).to.eql('CmdError.Remote');
      expect((error.cause as Error).message).to.eql('write denied by fixture');
    } finally {
      setup.dispose();
    }
  });

  it('wraps writeBytes command failures without hiding the cause', async () => {
    const setup = createTransport(
      handlersWithMutations({
        write() {
          throw new Error('write bytes denied by fixture');
        },
      }),
    );

    try {
      const error = await expectFilesClientError(
        () => setup.files.writeBytes('secret.bin', new Uint8Array([1])),
        'Files.Client.writeBytes: failed to write "secret.bin"',
      );
      expect((error.cause as Error).name).to.eql('CmdError.Remote');
      expect((error.cause as Error).message).to.eql('write bytes denied by fixture');
    } finally {
      setup.dispose();
    }
  });

  it('keeps write method types truthful', async () => {
    if (false) {
      const handle = undefined as unknown as t.Files.Client.Handle;
      const bytes = new Uint8Array([0, 1]);

      const textResult = await handle.writeText('index.html', '<h1>Hello</h1>', {
        encoding: 'utf8',
        mediaType: 'text/html',
      });
      const bytesResult = await handle.writeBytes('assets/app.wasm', bytes, {
        mediaType: 'application/wasm',
      });

      expectTypeOf(textResult).toEqualTypeOf<t.Files.Cmd.Write.Result>();
      expectTypeOf(bytesResult).toEqualTypeOf<t.Files.Cmd.Write.Result>();

      // @ts-expect-error writeText content is the method argument, not an option field.
      handle.writeText('index.html', '<h1>Hello</h1>', { content: 'ignored' });

      // @ts-expect-error writeBytes kind is fixed by the method, not caller-provided.
      handle.writeBytes('assets/app.wasm', bytes, { kind: 'bytes' });
    }
  });
});
