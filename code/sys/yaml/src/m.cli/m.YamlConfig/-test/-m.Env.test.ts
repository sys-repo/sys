import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t, Yaml } from '../common.ts';
import { YamlConfig } from '../mod.ts';

describe('YamlConfig.Env', () => {
  it('resolves from cwd .env with search:"cwd"', async () => {
    const dir = await Fs.makeTempDir();
    try {
      await Fs.write(Fs.join(dir.absolute, '.env'), 'SAMPLE_VALUE="from-cwd"\n');
      const ast = Yaml.parseAst('value: ${env:SAMPLE_VALUE}\n');

      const res = await YamlConfig.Env.resolveAst(ast, { cwd: dir.absolute, search: 'cwd' });

      expect(res.ok).to.eql(true);
      expect(res.refs).to.eql<t.Yaml.EnvRef.Ref[]>([
        { path: ['value'], name: 'SAMPLE_VALUE' },
      ]);
      expect(docOf<{ value: string }>(ast)).to.eql({ value: 'from-cwd' });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('defaults to upward .env search', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const parent = Fs.join(dir.absolute, 'parent');
      const child = Fs.join(parent, 'child');
      await Fs.ensureDir(child);
      await Fs.write(Fs.join(parent, '.env'), 'SAMPLE_UPWARD="from-parent"\n');
      const ast = Yaml.parseAst('value: ${env:SAMPLE_UPWARD}\n');

      const res = await YamlConfig.Env.resolveAst(ast, { cwd: child as t.StringDir });

      expect(res.ok).to.eql(true);
      expect(docOf<{ value: string }>(ast)).to.eql({ value: 'from-parent' });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('falls back to process env when .env does not provide the key', async () => {
    const key = 'SAMPLE_PROCESS_ONLY';
    const dir = await Fs.makeTempDir();
    try {
      await withProcessEnv(key, 'from-process', async () => {
        const ast = Yaml.parseAst(`value: \${env:${key}}\n`);

        const res = await YamlConfig.Env.resolveAst(ast, { cwd: dir.absolute, search: 'cwd' });

        expect(res.ok).to.eql(true);
        expect(docOf<{ value: string }>(ast)).to.eql({ value: 'from-process' });
      });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('treats empty .env values as present', async () => {
    const key = 'SAMPLE_EMPTY_VALUE';
    const dir = await Fs.makeTempDir();
    try {
      await Fs.write(Fs.join(dir.absolute, '.env'), `${key}=""\n`);
      await withProcessEnv(key, 'from-process', async () => {
        const ast = Yaml.parseAst(`value: \${env:${key}}\n`);

        const res = await YamlConfig.Env.resolveAst(ast, { cwd: dir.absolute, search: 'cwd' });

        expect(res.ok).to.eql(true);
        expect(docOf<{ value: string }>(ast)).to.eql({ value: '' });
      });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('returns YAML errors for missing env refs', async () => {
    const key = 'SAMPLE_MISSING_VALUE';
    const dir = await Fs.makeTempDir();
    try {
      await withoutProcessEnv(key, async () => {
        const ast = Yaml.parseAst(`value: \${env:${key}}\n`);

        const res = await YamlConfig.Env.resolveAst(ast, { cwd: dir.absolute, search: 'cwd' });

        expect(res.ok).to.eql(false);
        if (!res.ok) {
          expect(res.errors[0]?.message).to.eql(`value references missing env var: ${key}`);
        }
        expect(docOf<{ value: string }>(ast)).to.eql({ value: `\${env:${key}}` });
      });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});

/**
 * Helpers:
 */
const docOf = <T = Record<string, unknown>>(ast: t.Yaml.Ast): T => {
  const res = Yaml.toJS<T>(ast);
  expect(res.ok).to.eql(true);
  return res.data as T;
};

const withProcessEnv = async (key: string, value: string, fn: () => Promise<void>) => {
  const original = Deno.env.get(key);
  Deno.env.set(key, value);
  try {
    await fn();
  } finally {
    if (original == null) Deno.env.delete(key);
    else Deno.env.set(key, original);
  }
};

const withoutProcessEnv = async (key: string, fn: () => Promise<void>) => {
  const original = Deno.env.get(key);
  Deno.env.delete(key);
  try {
    await fn();
  } finally {
    if (original != null) Deno.env.set(key, original);
  }
};
