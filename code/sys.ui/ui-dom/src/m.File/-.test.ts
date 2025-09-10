import { describe, expect, it } from '../-test.ts';
import { Str } from './common.ts';
import { File, FileSize } from './mod.ts';

describe('File', () => {
  it('File.Size', () => {
    expect(File.Size).to.equal(FileSize);
    expect(File.Size.toString).to.equal(Str.bytes);
  });

  describe('toBlob', () => {
    it('with mimetype', () => {
      const data = new Uint8Array([1, 2, 3]);
      const blob = File.toBlob(data, 'text/plain');
      expect(blob.type).to.eql('text/plain');
      expect(blob.size).to.eql(3);
    });

    it('without mimetype (default: "application/octet-stream")', () => {
      const data = new Uint8Array([1, 2, 3]);
      const blob = File.toBlob(data);
      expect(blob.type).to.eql(File.DEFAULTS.mimetype);
      expect(blob.size).to.eql(3);
    });

    it('respects byteOffset/byteLength (no leaked bytes)', async () => {
      const backing = new Uint8Array([0, 1, 2, 3, 4, 5]).buffer; // larger buffer
      const view = new Uint8Array(backing, 2, 3); // [2,3,4]
      const blob = File.toBlob(view, 'application/octet-stream');

      expect(blob.type).to.eql('application/octet-stream');
      expect(blob.size).to.eql(3);

      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(Array.from(bytes)).to.eql([2, 3, 4]); // exact visible range only
    });

    it('handles SharedArrayBuffer by copying into a safe ArrayBuffer', async () => {
      const sab = new SharedArrayBuffer(4);
      const data = new Uint8Array(sab);
      data.set([9, 8, 7, 6]);

      const blob = File.toBlob(data, 'application/octet-stream');
      expect(blob.type).to.eql('application/octet-stream');
      expect(blob.size).to.eql(4);

      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(Array.from(bytes)).to.eql([9, 8, 7, 6]);
    });

    it('empty input → empty Blob', async () => {
      const blob = File.toBlob(new Uint8Array());
      expect(blob.type).to.eql(File.DEFAULTS.mimetype);
      expect(blob.size).to.eql(0);

      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(Array.from(bytes)).to.eql([]);
    });
  });

  describe('toUint8Array', () => {
    it('from blob (round-trip)', async () => {
      const src = new Uint8Array([1, 2, 3]);
      const blob = File.toBlob(src);
      const res = await File.toUint8Array(blob);
      expect(res).to.eql(src);
    });

    it('empty blob → empty Uint8Array', async () => {
      const blob = new Blob([]);
      const res = await File.toUint8Array(blob);
      expect(res).to.eql(new Uint8Array());
    });

    it('from DOM File (if supported)', async () => {
      const DomFile = (globalThis as unknown as { File?: typeof globalThis.File }).File;
      if (!DomFile) return; // feature-guard.

      const type = 'application/octet-stream';
      const file = new DomFile([new Uint8Array([9, 8, 7])], 'a.bin', { type });
      const res = await File.toUint8Array(file);
      expect(Array.from(res)).to.eql([9, 8, 7]);
    });
  });

  describe('toBlob (edge cases)', () => {
    it('respects byteOffset/byteLength (no leaked bytes)', async () => {
      const backing = new Uint8Array([0, 1, 2, 3, 4, 5]).buffer;
      const view = new Uint8Array(backing, 2, 3); // [2,3,4]
      const blob = File.toBlob(view, 'application/octet-stream');

      expect(blob.type).to.eql('application/octet-stream');
      expect(blob.size).to.eql(3);

      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(Array.from(bytes)).to.eql([2, 3, 4]);
    });

    it('handles SharedArrayBuffer by copying into a safe ArrayBuffer', async () => {
      if (typeof SharedArrayBuffer === 'undefined') return; // feature-guard

      const sab = new SharedArrayBuffer(4);
      const data = new Uint8Array(sab);
      data.set([9, 8, 7, 6]);

      const blob = File.toBlob(data, 'application/octet-stream');
      expect(blob.type).to.eql('application/octet-stream');
      expect(blob.size).to.eql(4);

      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(Array.from(bytes)).to.eql([9, 8, 7, 6]);
    });
  });
});
