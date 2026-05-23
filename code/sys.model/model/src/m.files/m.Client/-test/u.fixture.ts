import { CmdFixture } from '@sys/event/cmd/testing';
import { expect, type t } from '../../../-test.ts';
import { Files } from '../../mod.ts';
import { Client } from '../mod.ts';

export type TransportFixture = t.DisposableLike & {
  readonly files: t.Files.Client.Transport;
};

export function createTransport(handlers: t.Files.Cmd.HandlerMap): TransportFixture {
  const transport = CmdFixture.localTransport({ factory: Files.Cmd.make(), handlers });
  const files = Client.transport(transport.endpoint);
  return {
    files,
    dispose() {
      files.dispose();
      transport.dispose();
    },
  };
}

export function handlersWithRead(
  read: t.Files.Cmd.HandlerMap['files:read'],
): t.Files.Cmd.HandlerMap {
  const capabilities: t.Files.Capabilities = {
    list: false,
    stat: false,
    read: true,
    write: false,
    remove: false,
    watch: false,
    manifest: false,
  };
  const unsupported = () => {
    throw new Error('Unsupported test command');
  };

  return {
    'files:capabilities': () => capabilities,
    'files:list': unsupported,
    'files:stat': unsupported,
    'files:read': read,
    'files:write': unsupported,
    'files:remove': unsupported,
    'files:watch': unsupported,
    'files:manifest': unsupported,
  };
}

export async function expectFilesClientError(
  fn: () => Promise<unknown>,
  message: string,
): Promise<Error> {
  const error = await fn().then(
    () => undefined,
    (e: unknown) => e,
  );

  expect(error).to.be.instanceOf(Error);
  expect((error as Error).name).to.eql('FilesClientError');
  expect((error as Error).message).to.eql(message);
  return error as Error;
}
