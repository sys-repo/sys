import { describe, expect, it } from '../../-test.ts';
import { FileMap } from '../mod.ts';

describe('FileMap: validate', () => {
  it('ok: minimal valid map', () => {
    const json = { 'a.txt': 'data:text/plain;base64,QQ==' };
    const res = FileMap.validate(json);
    expect(res.error).to.eql(undefined);
    expect(res.fileMap).to.eql(json);
  });

  it('ok: multiple entries', () => {
    const json = {
      'src/mod.ts': 'data:application/typescript;base64,LyoqKiov',
      '.gitignore': 'data:text/plain;base64,LmRpc3QK',
    };
    const res = FileMap.validate(json);
    expect(res.error).to.eql(undefined);
    expect(res.fileMap).to.eql(json);
    // Sanity check: values are strings (not decoded here).
    expect(typeof res.fileMap?.['src/mod.ts']).to.eql('string');
  });

  describe('validate: string input', () => {
    it('ok: parses valid JSON string', () => {
      const jsonStr = JSON.stringify({ 'a.txt': 'data:text/plain;base64,QQ==' });
      const res = FileMap.validate(jsonStr);
      expect(res.error).to.eql(undefined);
      expect(res.fileMap).to.eql({ 'a.txt': 'data:text/plain;base64,QQ==' });
    });

    it('error: parse failure', () => {
      const res = FileMap.validate('{ not valid }');
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('JSON parse failed');
      expect(res.error?.cause?.name).to.eql('SyntaxError');
      expect(res.error?.cause?.message).to.include(`Expected property name or '}'`);
    });
  });

  describe('errors', () => {
    it('error: non-object (null)', () => {
      const res = FileMap.validate(null as unknown);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('expected an object');
    });

    it('error: non-object (array)', () => {
      const res = FileMap.validate(['x'] as unknown);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('expected an object');
    });

    it('error: non-object (primitive)', () => {
      const res = FileMap.validate(123 as unknown);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('expected an object');
    });

    it('error: empty key', () => {
      const json = { '': 'data:text/plain;base64,QQ==' } as unknown;
      const res = FileMap.validate(json);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('keys must be non-empty strings');
    });

    it('error: value is not a string', () => {
      const json = { 'a.txt': 123 } as unknown;
      const res = FileMap.validate(json);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('must be a string');
      expect(res.error?.message).to.include('a.txt');
    });
  });
});
