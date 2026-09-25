import { describe, expect, it } from '../../../-test.ts';
import { Fs, Is, type t, Yaml } from '../common.ts';
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
      expect(docOf(ast)).to.eql({ value: 'from-cwd' });
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

      const res = await YamlConfig.Env.resolveAst(ast, { cwd: child });

      expect(res.ok).to.eql(true);
      expect(docOf(ast)).to.eql({ value: 'from-parent' });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('absent or commented dotenv key → process-env fallback', async () => {
    const key = 'SAMPLE_PROCESS_ONLY';
    const dir = await Fs.makeTempDir();
    try {
      await withProcessEnv(key, 'from-process', async () => {
        for (const dotenv of ['', `# ${key}=commented-out`]) {
          await Fs.write(Fs.join(dir.absolute, '.env'), dotenv, { throw: true });
          const ast = Yaml.parseAst(`value: \${env:${key}}`);
          const res = await YamlConfig.Env.resolveAst(ast, { cwd: dir.absolute, search: 'cwd' });
          expect(res.ok).to.eql(true);
          expect(docOf(ast)).to.eql({ value: 'from-process' });
        }
      });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('active empty dotenv value → shadows process env under the default policy', async () => {
    const key = 'SAMPLE_EMPTY_VALUE';
    const dir = await Fs.makeTempDir();
    try {
      await Fs.write(Fs.join(dir.absolute, '.env'), `${key}=""\n`);
      await withProcessEnv(key, 'from-process', async () => {
        const ast = Yaml.parseAst(`value: \${env:${key}}\n`);

        const res = await YamlConfig.Env.resolveAst(ast, { cwd: dir.absolute, search: 'cwd' });

        expect(res.ok).to.eql(true);
        expect(docOf(ast)).to.eql({ value: '' });
      });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('nonEmpty → blank dotenv value rejected without process-env fallback', async () => {
    const key = 'SAMPLE_REQUIRED_VALUE';
    const dir = await Fs.makeTempDir();
    try {
      await Fs.write(Fs.join(dir.absolute, '.env'), `${key}=" "\n`);
      await withProcessEnv(key, 'from-process', async () => {
        const ast = Yaml.parseAst(`value: \${env:${key}}\n`);
        const options = { cwd: dir.absolute, search: 'cwd' as const, nonEmpty: true };
        const res = await YamlConfig.Env.resolveAst(ast, options);
        expect(res).to.deep.include({
          ok: false,
          unavailable: [{ path: ['value'], name: key }],
        });
        expect(docOf(ast)).to.eql({ value: `\${env:${key}}` });
      });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('returns YAML errors for missing env refs', async () => {
    const key = 'SAMPLE_MISSING_VALUE';
    const dir = await Fs.makeTempDir();
    try {
      await withProcessEnv(key, undefined, async () => {
        const ast = Yaml.parseAst(`value: \${env:${key}}\n`);

        const res = await YamlConfig.Env.resolveAst(ast, { cwd: dir.absolute, search: 'cwd' });

        expect(res.ok).to.eql(false);
        if (!res.ok) {
          expect(res.errors[0]?.message).to.eql(`value references missing env var: ${key}`);
        }
        expect(docOf(ast)).to.eql({ value: `\${env:${key}}` });
      });
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});

function docOf(ast: t.Yaml.Ast) {
  const result = Yaml.toJS(ast);
  expect(result.ok).to.eql(true);
  return result.data;
}

async function withProcessEnv(key: string, value: string | undefined, run: () => Promise<void>) {
  const original = Deno.env.get(key);
  try {
    if (Is.str(value)) Deno.env.set(key, value);
    else Deno.env.delete(key);
    await run();
  } finally {
    if (Is.str(original)) Deno.env.set(key, original);
    else Deno.env.delete(key);
  }
}
