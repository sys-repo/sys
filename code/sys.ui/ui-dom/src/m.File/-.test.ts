import { describe, expect, it } from '../-test.ts';
import { Str, D } from './common.ts';
import { File, FileSize } from './mod.ts';

describe('File', () => {
  const DomFile = (globalThis as unknown as { File?: typeof globalThis.File }).File;
  if (!DomFile) return; // feature-guard.

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
      const type = 'application/octet-stream';
      const file = new DomFile([new Uint8Array([9, 8, 7])], 'a.bin', { type });
      const res = await File.toUint8Array(file);
      expect(Array.from(res)).to.eql([9, 8, 7]);
    });
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

    // Edge: respects view window (no leaked bytes).
    it('respects byteOffset/byteLength (no leaked bytes)', async () => {
      const backing = new Uint8Array([0, 1, 2, 3, 4, 5]).buffer;
      const view = new Uint8Array(backing, 2, 3); // [2,3,4]
      const blob = File.toBlob(view, 'application/octet-stream');
      expect(blob.type).to.eql('application/octet-stream');
      expect(blob.size).to.eql(3);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(Array.from(bytes)).to.eql([2, 3, 4]);
    });

    // Edge: SAB fallback path.
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

    it('empty input → empty Blob', async () => {
      const blob = File.toBlob(new Uint8Array());
      expect(blob.type).to.eql(File.DEFAULTS.mimetype);
      expect(blob.size).to.eql(0);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(Array.from(bytes)).to.eql([]);
    });
  });

  describe('fromBlob', () => {
    it('round-trips bytes with provided name and defaults', async () => {
      const src = new Uint8Array([1, 2, 3]);
      const blob = File.toBlob(src); // NB: default type: application/octet-stream

      const bin = await File.fromBlob(blob, { name: 'a.bin', defaultModifiedAt: 123 });

      expect(bin.name).to.eql('a.bin');
      expect(bin.type).to.eql('application/octet-stream');
      expect(bin.type).to.eql(D.mimetype);
      expect(bin.modifiedAt).to.eql(123);
      expect(Array.from(bin.bytes)).to.eql([1, 2, 3]);
      expect(bin.hash).to.eql(undefined);
    });

    it('preserves blob.type when set', async () => {
      const src = new Uint8Array([9, 8, 7]);
      const blob = File.toBlob(src, 'text/plain');

      const bin = await File.fromBlob(blob, { name: 't.txt', defaultModifiedAt: 1 });

      expect(bin.type).to.eql('text/plain');
      expect(bin.name).to.eql('t.txt');
      expect(bin.modifiedAt).to.eql(1);
      expect(Array.from(bin.bytes)).to.eql([9, 8, 7]);
    });

    it('computes hash when injected', async () => {
      const src = new Uint8Array([4, 5, 6]);
      const blob = File.toBlob(src, 'application/octet-stream');

      // Deterministic, dependency-free "hash" for the test:
      const computeHash = (bytes: Uint8Array) => Array.from(bytes).join(',');

      const bin = await File.fromBlob(blob, {
        name: 'h.bin',
        defaultModifiedAt: 42,
        computeHash,
      });

      expect(bin.hash).to.eql('4,5,6');
      expect(Array.from(bin.bytes)).to.eql([4, 5, 6]);
    });

    it('empty blob → empty bytes, defaults applied', async () => {
      const blob = new Blob([]); // type === "", size === 0

      const bin = await File.fromBlob(blob, {
        name: 'empty.bin',
        defaultType: 'application/octet-stream',
        defaultModifiedAt: 7,
      });

      expect(bin.name).to.eql('empty.bin');
      expect(bin.type).to.eql('application/octet-stream');
      expect(bin.modifiedAt).to.eql(7);
      expect(Array.from(bin.bytes)).to.eql([]);
      expect(bin.hash).to.eql(undefined);
    });
  });

  describe('toFile', () => {
    it('wraps bytes into a File with metadata', async () => {
      const src = new Uint8Array([1, 2, 3]);
      const file = File.toFile({
        bytes: src,
        name: 'a.bin',
        type: 'application/octet-stream',
        modifiedAt: 1234567890,
      });

      expect(file.name).to.eql('a.bin');
      expect(file.type).to.eql('application/octet-stream');
      expect(file.lastModified).to.eql(1234567890);

      const round = new Uint8Array(await file.arrayBuffer());
      expect(round).to.eql(src);
    });
  });

  describe('fromFile', () => {
    if (!DomFile) return;

    it('preserves name, type, lastModified, and bytes', async () => {
      const src = new Uint8Array([1, 2, 3, 4]);
      const lastModified = 1234567890;

      const file = new DomFile([File.toBlob(src, 'text/plain')], 'a.txt', {
        lastModified,
        type: 'text/plain',
      });

      const bin = await File.fromFile(file);

      expect(bin.name).to.eql('a.txt');
      expect(bin.type).to.eql('text/plain');
      expect(bin.modifiedAt).to.eql(lastModified);
      expect(Array.from(bin.bytes)).to.eql([1, 2, 3, 4]);
      expect(bin.hash).to.eql(undefined);
    });

    it('supports injected hash computation', async () => {
      const src = new Uint8Array([9, 8, 7]);
      const file = new DomFile([File.toBlob(src, 'application/octet-stream')], 'b.bin', {
        lastModified: 42,
      });

      // Minimal, deterministic hash for the test (no external deps):
      const computeHash = (bytes: Uint8Array) => Array.from(bytes).join('-'); // "9-8-7"

      const bin = await File.fromFile(file, { computeHash });
      expect(bin.hash).to.eql('9-8-7');
      expect(Array.from(bin.bytes)).to.eql([9, 8, 7]);
    });

    it('handles empty files', async () => {
      const file = new DomFile(
        [File.toBlob(new Uint8Array(), 'application/octet-stream')],
        'empty.bin',
        {
          lastModified: 1,
        },
      );

      const bin = await File.fromFile(file);
      expect(bin.name).to.eql('empty.bin');
      expect(bin.type).to.eql('application/octet-stream');
      expect(bin.modifiedAt).to.eql(1);
      expect(Array.from(bin.bytes)).to.eql([]);
    });
  });
});
