import { Err } from '../common.ts';
import { expect, expectFailure, type t } from './u.fixture.ts';
export * from './u.fixture.ts';
export { directoryTarget } from './u.fixture.target.ts';

export const OPTIONS: t.FsRooted.TreeWriteOptions = Object.freeze({
  maxEntries: 16,
  maxPathBytes: 128,
  maxPathDepth: 8,
  maxFileBytes: 128 * 1024,
  maxTreeBytes: 256 * 1024,
  timeout: 10_000,
});

export async function* chunks(...values: Uint8Array[]): AsyncIterable<Uint8Array> {
  for (const value of values) yield value;
}

export function treeFile(
  content: unknown = chunks(new Uint8Array([1, 2, 3])),
  expectedBytes = 3,
  path = 'file',
): t.FsRooted.TreeFile {
  // Deliberately permissive fixture boundary for hostile producer inputs.
  return { kind: 'file', path, expectedBytes, content: content as AsyncIterable<Uint8Array> };
}

export async function expectWriteFailure(
  stage: t.FsRooted.Stage,
  entries: unknown,
  options: unknown,
  kind: t.FsRooted.FailureKind,
  committed = false,
): Promise<t.FsRooted.Failure> {
  const error = await expectFailure(
    () => Reflect.apply(stage.writer.writeTree, undefined, [entries, options]),
    kind,
    committed,
  );
  expect(Err.Is.error(error)).to.eql(true);
  expect(error.operation).to.eql('write-tree');
  return error;
}
