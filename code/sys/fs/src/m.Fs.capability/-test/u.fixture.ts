import type { Cmd as TCmd } from '@sys/event/t';
import type { t as TModel } from '@sys/model';
import { Files } from '@sys/model/files';
import { expect } from '../../-test.ts';
import { Fs } from '../../mod.ts';

export const POLICY = Files.Policy.readonly('**');

export type Fixture = {
  readonly workspace: string;
  readonly root: string;
  readonly outsideDir: string;
  readonly outsideSecret: string;
  readonly fileLink: string;
  readonly dirLink: string;
};

export async function setupFixture(): Promise<Fixture> {
  const workspace = await Fs.makeTempDir({ prefix: 'sys-fs-files-bridge-' });
  const root = Fs.join(workspace.absolute, 'root');
  const docs = Fs.join(root, 'docs');
  const outside = Fs.join(workspace.absolute, 'outside');
  const outsideSecret = Fs.join(outside, 'secret.txt');
  const fileLink = Fs.join(docs, 'leak.txt');
  const dirLink = Fs.join(docs, 'leak-dir');

  await Fs.ensureDir(docs);
  await Fs.ensureDir(outside);
  await Deno.writeTextFile(Fs.join(docs, 'readme.md'), 'hello\n');
  await Deno.writeTextFile(outsideSecret, 'secret\n');

  return {
    workspace: workspace.absolute,
    root,
    outsideDir: outside,
    outsideSecret,
    fileLink,
    dirLink,
  };
}

export function context<K extends TModel.Files.Cmd.Name>(
  name: K,
): TCmd.Handler.Context<TModel.Files.Cmd.Name, TModel.Files.Cmd.Event, K> {
  return {
    id: 'req-files-fs-bridge-test' as TCmd.ReqId,
    name,
    signal: new AbortController().signal,
    emit(_event: TModel.Files.Cmd.Event[K]) {
      return undefined;
    },
  };
}

export async function expectFilesFsError(
  fn: () => Promise<unknown> | unknown,
  name: TModel.FilesFs.Error.Kind,
  fixture: Fixture,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    const err = error as Error;
    expect(err.name).to.eql(name);
    expect(err.message.includes(fixture.root)).to.eql(false);
    expect(err.message.includes(fixture.outsideDir)).to.eql(false);
    expect(err.message.includes(fixture.outsideSecret)).to.eql(false);
    return;
  }
  throw new Error(`Expected ${name}.`);
}
