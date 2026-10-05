import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t, Yaml } from '../common.ts';
import { YamlConfig } from '../mod.ts';

type Doc = { readonly name: string; readonly count?: number };
type Change = { readonly op: string };

describe('YamlConfig.Edit', () => {
  it('creates a missing config from the initial document', async () => {
    const fs = await Fs.makeTempDir();
    try {
      const res = await YamlConfig.Edit.update<Doc, Change>({
        cwd: fs.absolute,
        config: './-config/sample.yaml',
        initial: () => ({ name: 'initial' }),
        load: () => {
          throw new Error('load should not run for missing config');
        },
        mutate: (doc) => ({
          doc: { ...doc, name: 'created', count: 1 },
          changed: true,
          change: { op: 'create' },
        }),
        stringify: stringifyDoc,
        validateText: assertValidDocText,
      });

      expect(res.kind).to.eql('written');
      expect(res.created).to.eql(true);
      expect(res.change).to.eql({ op: 'create' });
      expect(await loadDoc(res.path)).to.eql({ name: 'created', count: 1 });
    } finally {
      await Fs.remove(fs.absolute);
    }
  });

  it('dry-run validates but does not write', async () => {
    const fs = await Fs.makeTempDir();
    try {
      let validated = false;
      const config = './-config/sample.yaml';
      const path = Fs.resolve(fs.absolute, config) as t.StringPath;

      const res = await YamlConfig.Edit.update<Doc, Change>({
        cwd: fs.absolute,
        config,
        dryRun: true,
        initial: () => ({ name: 'initial' }),
        load: () => {
          throw new Error('load should not run for missing config');
        },
        mutate: (doc) => ({
          doc: { ...doc, name: 'preview' },
          changed: true,
          change: { op: 'preview' },
        }),
        stringify: stringifyDoc,
        validateText: (text) => {
          validated = true;
          assertValidDocText(text);
        },
      });

      expect(res.kind).to.eql('dry-run');
      expect(res.created).to.eql(true);
      expect(validated).to.eql(true);
      expect(await Fs.exists(path)).to.eql(false);
    } finally {
      await Fs.remove(fs.absolute);
    }
  });

  it('loads and updates an existing config', async () => {
    const fs = await Fs.makeTempDir();
    try {
      const config = './config.yaml';
      const path = Fs.resolve(fs.absolute, config) as t.StringPath;
      await Fs.write(path, stringifyDoc({ name: 'old', count: 1 }));

      const res = await YamlConfig.Edit.update<Doc, Change>({
        cwd: fs.absolute,
        config,
        initial: () => ({ name: 'initial' }),
        load: loadDoc,
        mutate: (doc) => ({
          doc: { ...doc, name: 'updated', count: (doc.count ?? 0) + 1 },
          changed: true,
          change: { op: 'update' },
        }),
        stringify: stringifyDoc,
        validateText: assertValidDocText,
      });

      expect(res.kind).to.eql('written');
      expect(res.created).to.eql(false);
      expect(await loadDoc(path)).to.eql({ name: 'updated', count: 2 });
    } finally {
      await Fs.remove(fs.absolute);
    }
  });

  it('returns unchanged without serializing or writing', async () => {
    const fs = await Fs.makeTempDir();
    try {
      const config = './config.yaml';
      const path = Fs.resolve(fs.absolute, config) as t.StringPath;
      const text = stringifyDoc({ name: 'same' });
      await Fs.write(path, text);

      let serialized = false;
      const res = await YamlConfig.Edit.update<Doc, Change>({
        cwd: fs.absolute,
        config,
        initial: () => ({ name: 'initial' }),
        load: loadDoc,
        mutate: (doc) => ({ doc, changed: false, change: { op: 'noop' } }),
        stringify: (doc) => {
          serialized = true;
          return stringifyDoc(doc);
        },
        validateText: assertValidDocText,
      });

      expect(res.kind).to.eql('unchanged');
      expect(res.created).to.eql(false);
      expect(serialized).to.eql(false);
      expect(await readText(path)).to.eql(text);
    } finally {
      await Fs.remove(fs.absolute);
    }
  });

  it('does not write invalid generated YAML', async () => {
    const fs = await Fs.makeTempDir();
    try {
      const config = './config.yaml';
      const path = Fs.resolve(fs.absolute, config) as t.StringPath;
      let error: unknown;

      try {
        await YamlConfig.Edit.update<Doc, Change>({
          cwd: fs.absolute,
          config,
          initial: () => ({ name: 'initial' }),
          load: loadDoc,
          mutate: (doc) => ({ doc, changed: true, change: { op: 'invalid' } }),
          stringify: () => 'count: 1\n',
          validateText: assertValidDocText,
        });
      } catch (thrown) {
        error = thrown;
      }

      expect(error).to.be.instanceOf(Error);
      expect(await Fs.exists(path)).to.eql(false);
    } finally {
      await Fs.remove(fs.absolute);
    }
  });
});

async function loadDoc(path: t.StringPath): Promise<Doc> {
  const text = await readText(path);
  const parsed = Yaml.parse<Doc>(text);
  if (parsed.error || !parsed.data) throw new Error(`Failed to parse YAML: ${path}`);
  return parsed.data;
}

async function readText(path: t.StringPath): Promise<string> {
  const read = await Fs.readText(path);
  if (!read.ok) throw new Error(`Failed to read: ${path}`);
  return read.data ?? '';
}

function stringifyDoc(doc: Doc): string {
  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) throw new Error('Failed to stringify YAML.');
  return yaml.data;
}

function assertValidDocText(text: string): void {
  const parsed = Yaml.parse<Doc>(text);
  if (parsed.error || !parsed.data?.name) throw new Error('Invalid generated YAML.');
}
