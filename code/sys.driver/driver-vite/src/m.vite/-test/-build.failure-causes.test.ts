import { describe, Err, expect, Fs, it, Json, type Pkg, pkg, stripAnsi } from '../../-test.ts';
import { Vite } from '../mod.ts';
import { buildWith } from '../u/u.build.ts';
import { createNativeBuildFixture } from './u.fixture.build.native.ts';

describe('Vite.build (producer failure controls)', () => {
  it('successful child but failed package write → no successful Dist authority', async () => {
    await using fixture = await createNativeBuildFixture('Vite.build package write failure');
    const { cwd, paths } = fixture;
    const stale = { name: '@stale/package', version: '0.0.1' };
    const cause = Err.std('Fixture package write failed.');
    let writes = 0;
    const result = await buildWith({
      dependencyPolicy: 'frozen-cache',
      paths,
      pkg,
      silent: true,
      spinner: false,
      exitOnError: false,
    }, async (path) => {
      writes += 1;
      expect(path).to.eql(Fs.join(cwd, 'dist/pkg/-pkg.json'));
      // Deterministic write failure with readable stale bytes; no host permission assumptions.
      await Fs.write(path, Json.stringify(stale), { throw: true });
      return { overwritten: false, error: cause };
    });
    expect(result.cmd.output.success, result.cmd.output.toString()).to.eql(true);
    expect(result.cmd.output.text.stdout).to.include('built in');
    expect(writes).to.eql(1);
    expect(result.ok).to.eql(false);
    if (result.ok) throw new Error('Expected package write refusal.');
    expect(result.error.message).to.eql('Vite build failed to write package declaration');
    expect(result.error.cause).to.equal(cause);
    const text = stripAnsi(result.toString({ width: 500 }));
    expect(text).to.include(result.error.message);
    expect(text).to.include('Cause: Error: Fixture package write failed.');
    expect(text).to.include('Bundle failed');
    expect(text).to.include('target: dist');
    expect(text).not.to.include('out:');
    expect(text).not.to.include('dist/dist.json');
    expect('dist' in result).to.eql(false);
    expect('pin' in result).to.eql(false);
    expect('manifestChecksum' in result).to.eql(false);
    expect(await Fs.exists(Fs.join(cwd, 'dist/dist.json'))).to.eql(false);
    expect((await Fs.readJson(Fs.join(cwd, 'dist/pkg/-pkg.json'))).data).to.eql(stale);
    expectBounded(result.toString({ width: 56 }), 56);
  });

  it('successful child but failed Dist compute → original cause without successful authority', async () => {
    await using fixture = await createNativeBuildFixture('Vite.build Dist compute failure');
    const { cwd, paths } = fixture;
    const cause = Err.std('Fixture Dist computation failed.');
    let computations = 0;
    const compute: typeof Pkg.Dist.compute = (args) => {
      computations += 1;
      expect(args.dir).to.eql(Fs.resolve(cwd, 'dist'));
      expect(args.save).to.eql(true);
      return Promise.resolve({ kind: 'failed', exists: true, dir: args.dir, error: cause });
    };
    const result = await buildWith(
      {
        dependencyPolicy: 'frozen-cache',
        paths,
        pkg,
        silent: true,
        spinner: false,
        exitOnError: false,
      },
      Fs.write,
      compute,
    );
    expect(result.cmd.output.success, result.cmd.output.toString()).to.eql(true);
    expect(result.cmd.output.text.stdout).to.include('built in');
    expect(computations).to.eql(1);
    expect(result.ok).to.eql(false);
    if (result.ok) throw new Error('Expected Dist computation refusal.');
    expect(result.error.message).to.eql('Vite build failed to compute dist metadata');
    expect(result.error.cause).to.equal(cause);
    const text = stripAnsi(result.toString({ width: 500 }));
    expect(text).to.include(result.error.message);
    expect(text).to.include('Cause: Error: Fixture Dist computation failed.');
    expect(text).to.include('Bundle failed');
    expect(text).not.to.include('out:');
    expect(text).not.to.include('dist/dist.json');
    expect('dist' in result).to.eql(false);
    expect('pin' in result).to.eql(false);
    expect('manifestChecksum' in result).to.eql(false);
    expect(await Fs.exists(Fs.join(cwd, 'dist/dist.json'))).to.eql(false);
    expect((await Fs.readJson(Fs.join(cwd, 'dist/pkg/-pkg.json'))).data).to.eql(pkg);
    expectBounded(result.toString({ width: 56 }), 56);
  });

  it('does not link an actual failed build', async () => {
    await using fixture = await createNativeBuildFixture('Vite.build failure output');
    const { cwd, paths } = fixture;
    await Fs.write(
      Fs.join(cwd, 'index.html'),
      '<script type="module" src="./missing.ts"></script>',
      { throw: true },
    );
    const res = await Vite.build({
      dependencyPolicy: 'frozen-cache',
      paths,
      pkg,
      silent: true,
      spinner: false,
      exitOnError: false,
    });
    const output = res.toString({ width: 80 });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected missing-input build refusal.');
    expect(res.cmd.output.success).to.eql(false);
    expect(`${res.cmd.output.text.stderr}\n${res.cmd.output.text.stdout}`).to.include('missing.ts');
    expect(res.error.message).to.eql('Vite build failed (non-zero exit)');
    expect('dist' in res).to.eql(false);
    expect('pin' in res).to.eql(false);
    expect('manifestChecksum' in res).to.eql(false);
    expectBounded(output, 80);
    expect(output).to.not.include('\x1b]8;;');
    expect(stripAnsi(output)).to.include('Bundle failed');
  });
});

function expectBounded(text: string, width: number) {
  stripAnsi(text).split('\n').forEach((line) => expect(line.length <= width).to.eql(true));
}
