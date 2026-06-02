import { describe, expect, it, type t } from '../../../-test.ts';
import { createTransport, expectFilesClientError, handlersWithRead } from './u.fixture.ts';

describe('Files.Client.Handle: readText method', () => {
  it('rejects content refs with a Files client domain error', async () => {
    const setup = createTransport(
      handlersWithRead((payload) => ({
        kind: 'ref',
        file: { path: payload.path, kind: 'file' },
        contentRef: { kind: 'ref', path: payload.path, ref: 'test-ref' as t.StringRef },
      })),
    );

    try {
      await expectFilesClientError(
        () => setup.files.readText('asset.bin'),
        'Files.Client.readText: inline text unavailable for "asset.bin"; backing returned contentRef.',
      );
    } finally {
      setup.dispose();
    }
  });

  it('uses the method path as the read command path', async () => {
    const seen: t.Files.Cmd.Read.Payload[] = [];
    const setup = createTransport(
      handlersWithRead((payload) => {
        seen.push(payload);
        return {
          kind: 'inline',
          file: { path: payload.path, kind: 'file' },
          encoding: 'utf8',
          content: 'ok',
        };
      }),
    );

    try {
      const sloppyOptions = { path: 'ignored.txt' } as unknown as t.Files.Client.Read.TextOptions;
      expect(await setup.files.readText('actual.txt', sloppyOptions)).to.eql('ok');
      expect(seen.map((payload) => payload.path)).to.eql(['actual.txt']);
    } finally {
      setup.dispose();
    }
  });

  it('only accepts truncated content when maxBytes was requested', async () => {
    const seen: t.Files.Cmd.Read.Payload[] = [];
    const setup = createTransport(
      handlersWithRead((payload) => {
        seen.push(payload);
        return {
          kind: 'inline',
          file: { path: payload.path, kind: 'file', size: 10 },
          encoding: 'utf8',
          content: 'abcd',
          truncated: true,
        };
      }),
    );

    try {
      await expectFilesClientError(
        () => setup.files.readText('long.txt'),
        'Files.Client.readText: truncated read for "long.txt"; pass maxBytes to accept bounded content.',
      );
      expect(await setup.files.readText('long.txt', { maxBytes: 4 })).to.eql('abcd');
      expect(seen.map((payload) => payload.maxBytes)).to.eql([undefined, 4]);
    } finally {
      setup.dispose();
    }
  });

  it('wraps command failures without hiding the cause', async () => {
    const setup = createTransport(
      handlersWithRead(() => {
        throw new Error('read denied by fixture');
      }),
    );

    try {
      const error = await expectFilesClientError(
        () => setup.files.readText('secret.txt'),
        'Files.Client.readText: failed to read "secret.txt"',
      );

      expect((error.cause as Error).name).to.eql('CmdError.Remote');
      expect((error.cause as Error).message).to.eql('read denied by fixture');
    } finally {
      setup.dispose();
    }
  });
});
