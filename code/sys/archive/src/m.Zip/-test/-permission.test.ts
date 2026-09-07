import { Hash } from '@sys/crypto/hash';
import { describe, expect, it } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { zip } from './u.fixture.ts';

/** APPNOTE 6.3.10 sections 4.3.1 and 4.3.16: hand-assembled empty ZIP32 EOCD. */
const EMPTY_ZIP32 = new Uint8Array([
  0x50,
  0x4b,
  0x05,
  0x06,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]);

describe('@sys/archive/zip: ambient-authority boundary', () => {
  it('extracts stored and deflated bytes through an in-memory sink without ambient authority', async () => {
    const archive = await Zip.open(
      zip([
        { name: 'a', data: 'stored' },
        { name: 'd/b', data: 'deflated', method: 8 },
      ]).bytes,
      { timeout: 10_000 },
    );
    let expanded = 0;
    const result = await archive.extractTo({
      async writeTree(entries) {
        for (const entry of entries) {
          if (entry.kind === 'file') {
            for await (const chunk of entry.content) expanded += chunk.byteLength;
          }
        }
      },
    }, { timeout: 10_000 });
    expect(expanded).to.eql(14);
    expect(result.expandedBytes).to.eql(expanded);
  });

  it('opens and tests owned bytes with every ambient permission denied', async () => {
    expect(Hash.sha256(EMPTY_ZIP32)).to.eql(
      'sha256-8739c76e681f900923b900c9df0ef75cf421d39cabb54650c4b9ad19b6a76d85',
    );
    const archive = await Zip.open(EMPTY_ZIP32, {
      timeout: 10_000,
      limits: {
        maxSourceBytes: 1024,
        maxEntries: 1,
        maxTreeEntries: 1,
        maxPathBytes: 32,
        maxPathDepth: 2,
        maxEntryBytes: 1024,
        maxExpandedBytes: 1024,
        maxErrorChars: 200,
      },
    });
    expect(archive.inspect().format).to.eql('zip32');
    expect((await archive.test({ timeout: 10_000 })).kind).to.eql('passed');
  });
});
