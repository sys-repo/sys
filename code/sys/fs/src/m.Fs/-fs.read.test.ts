import { type t, describe, Err, expect, it } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: read from the file-system operations', () => {
  const assertSuccess = (res: t.FsReadResponse<unknown>, path: string) => {
    expect(res.ok).to.eql(true);
    expect(res.exists).to.eql(true);
    expect(res.path).to.eql(Fs.resolve(path));
    expect(res.error).to.eql(undefined);
    expect(res.errorReason).to.eql(undefined);
  };

  const assertNotFound = (res: t.FsReadResponse<unknown>, path: string) => {
    expect(res.ok).to.eql(false);
    expect(res.exists).to.eql(false);
    expect(res.path).to.eql(Fs.resolve(path));
    expect(res.errorReason).to.eql('NotFound');
    expect(res.error?.message).to.include('file does not exist at path');
    expect(res.error?.message).to.include(path);
    expect(Err.Is.stdError(res.error)).to.eql(true);
  };

  const assertParseError = (res: t.FsReadResponse<unknown>, path: string) => {
    expect(res.ok).to.eql(false);
    expect(res.exists).to.eql(true);
    expect(res.path).to.eql(Fs.resolve(path));
    expect(res.errorReason).to.eql('ParseError');
  };

  const assertDecodingError = (res: t.FsReadResponse<unknown>, path: string) => {
    expect(res.ok).to.eql(false);
    expect(res.exists).to.eql(true);
    expect(res.path).to.eql(Fs.resolve(path));
    expect(res.errorReason).to.eql('DecodingError');
    expect(res.error?.message).to.include('The encoded data is not valid');
  };

  describe('Fs.readText', () => {
    it('success', async () => {
      const path = './src/-test/-sample-files/foo.txt';
      const res = await Fs.readText(path);
      assertSuccess(res, path);
      expect(res.data).to.include('Foo-👋');
    });

    it('fail: does not exist', async () => {
      const path = '404.txt';
      const res = await Fs.readText(path);
      assertNotFound(res, path);
      expect(res.error?.message).to.include('Text file');
    });

    it('fail: not a text document', async () => {
      const path = './src/-test/-sample-files/invalid.bin';
      const res = await Fs.readText(path);
      assertDecodingError(res, path);
    });
  });

  describe('Fs.readJson', () => {
    it('success', async () => {
      const path = './deno.json';
      const res = await Fs.readJson<t.Pkg>(path);
      assertSuccess(res, path);
      expect(res.data?.name).to.eql('@sys/fs');
    });

    it('fail: does not exist', async () => {
      const path = '404.json';
      const res = await Fs.readJson(path);
      assertNotFound(res, path);
      expect(res.error?.message).to.include('JSON file');
    });

    it('fail: JSON parse error', async () => {
      const path = './README.md'; // NB: markdown not parse-able as JSON.
      const res = await Fs.readJson<t.Pkg>(path);
      assertParseError(res, path);
      expect(res.error?.name).to.eql('SyntaxError');
      expect(res.error?.message).to.include('Unexpected token');
    });

    it('fail: not a text document', async () => {
      const path = './src/-test/-sample-files/invalid.bin';
      const res = await Fs.readJson(path);
      assertDecodingError(res, path);
    });
  });

  describe('Fs.readYaml', () => {
    type T = { foo: number };

    it('success', async () => {
      const path = './src/-test/-sample-files/foo.yaml';
      const res = await Fs.readYaml<T>(path);
      assertSuccess(res, path);
      expect(res.data?.foo).to.eql(123);
    });

    it('fail: does not exist', async () => {
      const path = '404.yaml';
      const res = await Fs.readYaml(path);
      assertNotFound(res, path);
      expect(res.error?.message).to.include('YAML file');
    });

    it('fail: YAML parse error', async () => {
      const path = Fs.resolve('./README.md'); // NB: markdown not parse-able as YAML.
      const res = await Fs.readYaml<T>(path);
      assertParseError(res, path);
      expect(res.error?.name).to.eql('YAMLParseError');
      expect(res.error?.message).to.include('Unexpected scalar token in YAML stream');
    });

    it('fail: not a text document', async () => {
      const path = './src/-test/-sample-files/invalid.bin';
      const res = await Fs.readYaml(path);
      assertDecodingError(res, path);
    });
  });

  describe('Fs.read (binary)', () => {
    it('success: binary file', async () => {
      const path = './src/-test/-sample-files/foo.bin';
      const res = await Fs.read(path);
      assertSuccess(res, path);
      expect(res.data).to.eql(new Uint8Array([1, 2, 3]));
    });

    it('success: text (as binary)', async () => {
      const path = './src/-test/-sample-files/foo.txt';
      const res = await Fs.read(path);
      assertSuccess(res, path);

      const text = 'Foo-👋\n';
      const binary = new TextEncoder().encode(text);
      expect(res.data).to.eql(binary);
    });

    it('fail: does not exist', async () => {
      const path = '404.bin';
      const res = await Fs.read(path);
      assertNotFound(res, path);
      expect(res.error?.message).to.include('Binary file');
    });
  });
});
