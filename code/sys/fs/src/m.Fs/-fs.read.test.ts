import { type t, describe, expect, it } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: read from the file-system operations', () => {
  describe('Fs.readJson', () => {
    it('success', async () => {
      const path = './deno.json';
      const res = await Fs.readJson<t.Pkg>(path);

      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.path).to.eql(Fs.resolve(path));
      expect(res.data?.name).to.eql('@sys/fs');
      expect(res.error).to.eql(undefined);
      expect(res.errorReason).to.eql(undefined);
    });

    it('fail: does not exist', async () => {
      const path = '404-no-exist.json';
      const res = await Fs.readJson(path);

      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(false);
      expect(res.path).to.eql(Fs.resolve(path));
      expect(res.errorReason).to.eql('NotFound');
      expect(res.error?.message).to.include('JSON file does not exist at path');
      expect(res.error?.message).to.include(path);
    });

    it('fail: JSON parse error', async () => {
      const path = Fs.resolve('./README.md'); // NB: markdown not parse-able as JSON.
      const res = await Fs.readJson<t.Pkg>(path);
      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(true);
      expect(res.path).to.eql(path);
      expect(res.errorReason).to.eql('ParseError');
      expect(res.error?.message).to.include('Unexpected token');
    });
  });

  describe('Fs.readYaml', () => {
    type File1 = { foo: number };

    it('success', async () => {
      const path = './src/-test/-sample-yaml/file-1.yaml';
      const res = await Fs.readYaml<File1>(path);

      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.path).to.eql(Fs.resolve(path));
      expect(res.data?.foo).to.eql(123);
      expect(res.error).to.eql(undefined);
      expect(res.errorReason).to.eql(undefined);
    });

    it('fail: does not exist', async () => {
      const path = '404-no-exist.json';
      const res = await Fs.readYaml(path);

      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(false);
      expect(res.path).to.eql(Fs.resolve(path));
      expect(res.errorReason).to.eql('NotFound');
      expect(res.error?.message).to.include('YAML file does not exist at path');
      expect(res.error?.message).to.include(path);
    });

    it('fail: JSON parse error', async () => {
      const path = Fs.resolve('./README.md'); // NB: markdown not parse-able as YAML.
      const res = await Fs.readYaml<File1>(path);
      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(true);

      expect(res.path).to.eql(path);
      expect(res.errorReason).to.eql('ParseError');
      expect(res.error?.message).to.include('Unexpected scalar token in YAML stream');
    });
  });

  describe('Fs.walkUp', () => {
    it('starts at dir', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      await Fs.walkUp('./deno.json', (e) => fired.push(e));

      expect(fired.length).to.greaterThan(3);
      const first = fired[0];
      const last = fired[fired.length - 1];

      expect(first.dir).to.eql(Fs.resolve('.')); // NB: the parent dir, not the given file.
      expect(last.dir).to.eql('/');
    });

    it('walks up and stops before end', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      await Fs.walkUp('./deno.json', (e) => {
        fired.push(e);
        if (fired.length > 1) e.stop();
      });
      expect(fired.length).to.eql(2); // NB: because stopped.
    });

    it('retrieves files from callback', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      const files: t.FsWalkFile[] = [];
      await Fs.walkUp('./deno.json', async (e) => {
        fired.push(e);
        files.push(...(await e.files()));
        e.stop();
      });
      const names = files.map((e) => e.name);
      expect(names.includes('README.md')).to.eql(true);
      expect(names.includes('deno.json')).to.eql(true);
    });
  });
});
