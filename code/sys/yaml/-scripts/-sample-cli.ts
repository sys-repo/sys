import { type t, c, Fs, Is } from '../src/m.cli/common.ts';
import { YamlConfig } from '../src/m.cli/mod.ts';

type O = Record<string, unknown>;

/**
 * Sample config-file schema.
 */
const schema = {
  init: () => ({ title: 'Sample', enabled: true }),
  validate: (value: unknown) => {
    const obj = Is.object(value) ? (value as O) : undefined;
    const ok = typeof obj?.title === 'string';
    return { ok, errors: ok ? [] : ['missing title'] };
  },
};

/**
 * Sample usage:
 */
async function sample(cwd: t.StringDir) {
  return YamlConfig.menu({
    cwd,
    dir: '-sample.configs',
    label: 'Sample configs',
    itemLabel: 'config',
    addLabel: '  add: <config>',
    schema,
    actions: {
      extra: [
        { name: ({ name }) => `run ${c.green(name)}`, value: 'run' },
        { name: 'foo', value: 'foo' },
        { name: 'bar', value: 'bar' },
      ],
      async onAction({ action, path }) {
        const outDir = Fs.join(cwd, 'out');
        await Fs.ensureDir(outDir);
        if (action === 'run') {
          await Fs.write(Fs.join(outDir, 'run.txt'), `run: ${path}\n`);
        }
        if (action === 'foo') {
          const value = Math.random().toString(36).slice(2);
          await Fs.write(Fs.join(outDir, 'foo.txt'), `${value}\n`);
          return { kind: 'stay' };
        }
        if (action === 'bar') {
          await Fs.write(Fs.join(outDir, 'bar.txt'), `bar: ${path}\n`);
          return { kind: 'back' };
        }
        return {
          kind: 'action',
          action,
          path,
        };
      },
    },
  });
}

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const dir = Fs.join(Fs.cwd(), '.tmp');
  await Fs.ensureDir(dir);
  const res = await sample(dir);
  console.info(res);
}
