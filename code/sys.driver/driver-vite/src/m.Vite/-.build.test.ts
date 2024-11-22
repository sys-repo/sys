import { c, describe, expect, Fs, it, pkg, type t } from '../-test.ts';
import { INPUT } from './-u.ts';
import { Vite } from './mod.ts';

describe('Vite.build', () => {
  const testBuild = async (input: t.StringPath) => {
    const outDir = Vite.Config.outDir.test.random();
    const res = await Vite.build({ pkg, input, outDir });
    const { paths } = res;

    console.log('res', res);
    console.log('res.toString()', res.toString());

    expect(res.ok).to.eql(true);
    expect(res.cmd.input).to.include('deno run');
    expect(res.cmd.input).to.include('--node-modules-dir npm:vite');
    expect(res.elapsed).to.be.greaterThan(0);

    // Ensure the {pkg:name:version} data is included in the composite <digest> hash.
    const keys = Object.keys(res.dist.hash.parts);
    const hasPkg = keys.some((key) => key.startsWith('./pkg/-pkg.json'));
    expect(hasPkg).to.eql(true);

    // Ensure the HTML file exists.
    const html = await Deno.readTextFile(Fs.join(outDir, 'index.html'));
    const distJson = (await Fs.readJson<t.DistPkg>(Fs.join(outDir, 'dist.json'))).json;
    return {
      input,
      files: { html, distJson },
      paths,
      res,
    } as const;
  };

  const logDist = (input: t.StringPath, dist: t.DistPkg) => {
    const distfile = c.bold(c.white('./dist/dist.json'));
    console.info();
    console.info(c.green(`input: ${input}`));
    console.info(c.green(' ↓'));
    console.info(c.green(`output: Pkg.Dist.compute → ${distfile}`));
    console.info();
    console.info(dist);
    console.info();
  };

  it('sample-1: simple', async () => {
    const input = INPUT.sample1;
    const { res, files } = await testBuild(input);
    expect(files.html).to.include(`<title>Sample-1</title>`);

    expect(res.dist).to.eql(files.distJson);
    expect(res.dist.pkg).to.eql(pkg);
    expect(res.dist.size.bytes).to.be.greaterThan(160_000);

    logDist(input, res.dist);
  });

  it('sample-2: monorepo imports | Module-B  ←  Module-A', async () => {
    const input = INPUT.sample2;
    const { res, files } = await testBuild(input);
    expect(files.html).to.include(`<title>Sample-2</title>`);
    logDist(input, res.dist);
  });

  it.only('sample-3: main.ts entry point', async () => {
    const input = INPUT.sample3;
    const { res, files } = await testBuild(input);
    console.log('res', res);
  });
});
