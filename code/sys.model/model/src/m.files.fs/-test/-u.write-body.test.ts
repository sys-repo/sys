import { describe, expect, it, type t } from '../../-test.ts';
import { writeBody } from '../u/u.write-body.ts';
import { expectFilesFsError } from './u.fixture.ts';

const PATH = 'docs/write.txt' as t.Files.String.Path;

describe('FilesFs write body utilities', () => {
  it('encodes text by UTF-8 bytes and preserves media type metadata', () => {
    const body = writeBody(
      {
        kind: 'text',
        path: PATH,
        content: 'é',
        mediaType: 'text/plain',
      },
      PATH,
      2 as t.NumberBytes,
    );

    expect(Array.from(body.bytes)).to.eql([195, 169]);
    expect(body.mediaType).to.eql('text/plain');
  });

  it('copies byte payloads before handing them to mutation code', () => {
    const content = new Uint8Array([1, 2, 3]);
    const body = writeBody({ kind: 'bytes', path: PATH, content }, PATH, 3 as t.NumberBytes);

    content[0] = 9;
    expect(Array.from(body.bytes)).to.eql([1, 2, 3]);
  });

  it('rejects over-limit text and bytes by encoded byte length', async () => {
    await expectFilesFsError(
      () => writeBody({ kind: 'text', path: PATH, content: 'é' }, PATH, 1 as t.NumberBytes),
      'FilesFsError.WriteTooLarge',
    );
    await expectFilesFsError(
      () => {
        return writeBody(
          { kind: 'bytes', path: PATH, content: new Uint8Array([1, 2]) },
          PATH,
          1 as t.NumberBytes,
        );
      },
      'FilesFsError.WriteTooLarge',
    );
  });

  it('rejects invalid write payload fields with files/fs errors', async () => {
    await expectFilesFsError(
      () => {
        return writeBody(
          {
            kind: 'text',
            path: PATH,
            content: 'x',
            encoding: 'utf16',
          } as unknown as t.Files.Cmd.Write.Payload,
          PATH,
          undefined,
        );
      },
      'FilesFsError.Unsupported',
    );
    await expectFilesFsError(
      () => {
        return writeBody(
          { kind: 'text', path: PATH, content: 1 } as unknown as t.Files.Cmd.Write.Payload,
          PATH,
          undefined,
        );
      },
      'FilesFsError.InvalidPath',
    );
    await expectFilesFsError(
      () => {
        return writeBody(
          { kind: 'bytes', path: PATH, content: [1, 2] } as unknown as t.Files.Cmd.Write.Payload,
          PATH,
          undefined,
        );
      },
      'FilesFsError.InvalidPath',
    );
    await expectFilesFsError(
      () => {
        return writeBody(
          {
            kind: 'text',
            path: PATH,
            content: 'x',
            mediaType: 1,
          } as unknown as t.Files.Cmd.Write.Payload,
          PATH,
          undefined,
        );
      },
      'FilesFsError.InvalidPath',
    );
    await expectFilesFsError(
      () => {
        return writeBody(
          { kind: 'other', path: PATH, content: 'x' } as unknown as t.Files.Cmd.Write.Payload,
          PATH,
          undefined,
        );
      },
      'FilesFsError.InvalidPath',
    );
  });
});
