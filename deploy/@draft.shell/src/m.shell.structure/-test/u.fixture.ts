import type { Cmd } from '@sys/event/t';
import { Files } from '@sys/model/files/fs';
import type * as TFiles from '@sys/model/files/t';
import { Fs } from '../../-test.ts';

type ReadTextOptions = {
  readonly root: string;
  readonly path: string;
};

export const Fixture = {
  Files: { readText },
} as const;

/**
 * TODO(/files-client-local-facade): replace this raw Files Cmd handler dispatch with
 * `Files.Client.local(backing)` + `Files.Client.readText(client, path)` after the upstream
 * @sys/model/files client facade lands. See: `-agent/-plan/cmd.files/client-local-facade.plan.md`.
 */
async function readText(options: ReadTextOptions): Promise<string> {
  const { path, root } = options;
  const policy = Files.Policy.readonly(path);
  const fs = Fs.Capability.Files.Readonly.create(Fs);
  const backing = Files.Fs.Readonly.create({ fs, root, policy });

  const read = await backing.handlers[Files.Cmd.Name.read](
    { path },
    context(Files.Cmd.Name.read),
  );
  if (read.kind !== 'inline') throw new Error('Expected inline Files<T> read result.');
  return read.content;
}

function context<K extends TFiles.Files.Cmd.Name>(
  name: K,
): Cmd.Handler.Context<TFiles.Files.Cmd.Name, TFiles.Files.Cmd.Event, K> {
  const controller = new AbortController();
  return {
    id: 'req-fixture' as Cmd.ReqId,
    name,
    signal: controller.signal,
    emit: () => undefined,
  };
}
