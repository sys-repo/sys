import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../mod.ts';
import { allowed, snapshotPolicy } from '../u/u.policy.ts';

describe('Files write/remove contracts', () => {
  it('exposes write/remove as first-class Cmd names', () => {
    expect(Files.Cmd.Name.write).to.eql('files:write');
    expect(Files.Cmd.Name.remove).to.eql('files:remove');
    expectTypeOf(Files.Cmd.Name.write).toEqualTypeOf<t.Files.Cmd.Name.Write>();
    expectTypeOf(Files.Cmd.Name.remove).toEqualTypeOf<t.Files.Cmd.Name.Remove>();
  });

  it('models write as whole-file text or bytes, not edit/patch authority', () => {
    const text: t.Files.Cmd.Write.TextPayload = {
      kind: 'text',
      path: 'docs/readme.md',
      content: '# Hello\n',
      encoding: 'utf8',
      mediaType: 'text/markdown',
    };
    const bytes = new Uint8Array([0, 1, 2, 255]);
    const binary: t.Files.Cmd.Write.BytesPayload = {
      kind: 'bytes',
      path: 'images/logo.png',
      content: bytes,
      mediaType: 'image/png',
    };

    const payloads: readonly t.Files.Cmd.Write.Payload[] = [text, binary];
    const created: t.Files.Cmd.Write.Result = {
      kind: 'created',
      path: text.path,
      entry: { kind: 'file', path: text.path, size: 8, mediaType: 'text/markdown' },
    };
    const modified: t.Files.Cmd.Write.Result = { kind: 'modified', path: binary.path };

    // @ts-expect-error Text writes require string content.
    const badText: t.Files.Cmd.Write.TextPayload = { ...text, content: bytes };

    // @ts-expect-error Byte writes require Uint8Array content.
    const badBytes: t.Files.Cmd.Write.BytesPayload = { ...binary, content: '# Hello\n' };

    const editLike = {
      kind: 'edit',
      path: 'docs/readme.md',
      edits: [{ oldText: 'Hello', newText: 'Hi' }],
    } as const;

    // @ts-expect-error Files write is not an edit/patch/splice surface.
    const badEdit: t.Files.Cmd.Write.Payload = editLike;

    expect(payloads.map((payload) => payload.kind)).to.eql(['text', 'bytes']);
    expect(created.kind).to.eql('created');
    expect(modified.kind).to.eql('modified');
    expect(badText.content).to.equal(bytes);
    expect(badBytes.content).to.eql('# Hello\n');
    expect(badEdit.kind).to.eql('edit');
  });

  it('models remove as delete authority with an optional recursive intent', () => {
    const file: t.Files.Cmd.Remove.Payload = { path: 'docs/old.md' };
    const tree: t.Files.Cmd.Remove.Payload = { path: 'docs/tmp', recursive: true };
    const result: t.Files.Cmd.Remove.Result = { kind: 'deleted', path: file.path };

    // @ts-expect-error Remove payloads do not carry write content.
    const badRemove: t.Files.Cmd.Remove.Payload = { path: 'docs/old.md', content: 'nope' };

    expect(file.path).to.eql('docs/old.md');
    expect(tree.recursive).to.eql(true);
    expect(result.kind).to.eql('deleted');
    expect((badRemove as { content?: string }).content).to.eql('nope');
  });

  it('keeps write/remove policy explicit and deny-first', () => {
    const write = ['docs/**'];
    const policy = snapshotPolicy(
      {
        write,
        remove: 'docs/tmp/**',
        deny: 'docs/private/**',
      },
      invalid,
    );
    write.push('docs/private/**');

    expect(allowed(policy, 'write', 'docs/readme.md')).to.eql(true);
    expect(allowed(policy, 'write', 'docs/private/secret.md')).to.eql(false);
    expect(allowed(policy, 'remove', 'docs/tmp/cache.txt')).to.eql(true);
    expect(allowed(policy, 'remove', 'docs/readme.md')).to.eql(false);

    const readonly = Files.Policy.readonly('docs/**');
    expect('write' in readonly).to.eql(false);
    expect('remove' in readonly).to.eql(false);

    expect(() => snapshotPolicy({ write: [123] as never }, invalid)).to.throw(
      'Invalid Files policy match',
    );
    expect(() => snapshotPolicy({ remove: [123] as never }, invalid)).to.throw(
      'Invalid Files policy match',
    );
  });
});

function invalid(message: string): Error {
  return new Error(message);
}
