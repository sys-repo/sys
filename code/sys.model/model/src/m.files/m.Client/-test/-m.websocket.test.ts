import { WebFixture } from '@sys/testing/web';
import { describe, expect, it, type t } from '../../../-test.ts';
import { Client } from '../mod.ts';
import { expectFilesClientError } from './u.fixture.ts';

describe('Files.Client.websocket', () => {
  it('returns handle shape and supports idempotent close/dispose ordering', async () => {
    const mock = WebFixture.WebSocket.mock();
    let files: t.Files.Client.WebSocket | undefined;

    try {
      files = await Client.websocket('ws://example.test/files' as t.StringUrl);
      expect(Object.keys(files).sort()).to.eql([
        'capabilities',
        'close',
        'cmd',
        'dispose',
        'dispose$',
        'disposed',
        'finished',
        'list',
        'manifest',
        'readText',
        'stat',
        'url',
        'watch',
      ]);
      expect(files.url).to.eql('ws://example.test/files');
      expect('send' in files).to.eql(false);
      expect('stream' in files).to.eql(false);

      await files.close('test-close');
      expect(files.disposed).to.eql(true);
      await files.close('test-close-again');
      files.dispose('dispose-after-close');
    } finally {
      if (files && !files.disposed) await files.close('test-cleanup');
      mock.dispose();
    }
  });

  it('wraps open failures with Files client context', async () => {
    const url = 'not-a-websocket-url' as t.StringUrl;
    const error = await expectFilesClientError(
      () => Client.websocket(url),
      `Files.Client.websocket: failed to open ${url}`,
    );

    expect(error.cause).to.not.eql(undefined);
  });
});
