import { describe, expect, expectError, Fs, it, Str, Testing, Yaml } from '../-test.ts';
import { cli as proxyCli } from '../http.server/m.HttpProxy/m.cli/mod.ts';
import { HttpProxy } from '../http.server/m.HttpProxy/mod.ts';
import { cli as staticCli } from '../http.server/m.HttpStatic/m.cli.ts';
import { HttpStatic } from '../http.server/m.HttpStatic/mod.ts';

const hostname = '127.0.0.1';
const body = 'strict listener fixture';

const owners = [
  { name: 'static', endpoint: HttpStatic, cli: staticCli },
  { name: 'proxy', endpoint: HttpProxy, cli: proxyCli },
] as const;

const readBody = async (port: number) => (await fetch(`http://${hostname}:${port}/`)).text();

describe('HTTP owner strict listener ports', () => {
  for (const { name, endpoint, cli } of owners) {
    const config = `./${name}.yaml`;

    it(`${name}: YAML and direct overrides determine the actual bind`, () =>
      Testing.withTmpDir(async (cwd) => {
        await Fs.write(Fs.join(cwd, 'index.html'), body);
        await using upstream = name === 'proxy'
          ? await HttpStatic.start({ cwd, hostname, port: 0, silent: true })
          : undefined;
        const args = { cwd, paths: { config }, silent: true };
        const blocker = Deno.listen({ hostname, port: 0 });
        const { port } = blocker.addr;
        const input = { cwd, config, hostname, port };

        try {
          await endpoint.Config.add(input);
          if (upstream) await HttpProxy.Root.set({ cwd, config, upstream: `${upstream.origin}/` });
          {
            await using fallback = await endpoint.start(args);
            expect(fallback.port).not.to.eql(port);
            expect(await readBody(fallback.port)).to.eql(body);
          }

          const strict = await endpoint.Config.add({ ...input, strictPort: true });
          expect(strict.kind).to.eql('updated');
          await endpoint.Config.add({ ...input, name: `${name}:renamed` });
          if (upstream) {
            await HttpProxy.Mount.add({
              cwd,
              config,
              mount: '/assets/',
              upstream: `${upstream.origin}/`,
            });
          }
          for (const override of [{}, { strictPort: undefined }, { port: undefined }]) {
            const cause = await Promise.resolve(endpoint.start({ ...args, ...override })).then(
              (unexpected) => unexpected.close(),
              (error: unknown) => error,
            );
            expect(cause).to.be.instanceOf(Deno.errors.AddrInUse);
          }
          for (const override of [{ strictPort: false }, { port: 0 }]) {
            await using alternate = await endpoint.start({ ...args, ...override });
            expect(alternate.port).not.to.eql(port);
            expect(await readBody(alternate.port)).to.eql(body);
          }
        } finally {
          blocker.close();
        }

        {
          const unset = { port: undefined, strictPort: undefined };
          await using exact = await endpoint.start({ ...args, ...unset });
          expect(exact.port).to.eql(port);
          expect(await readBody(exact.port)).to.eql(body);
        }
        await endpoint.Config.add({ ...input, port: 0 });
        await using ephemeral = await endpoint.start(args);
        expect(ephemeral.port).to.be.greaterThan(0);
        expect(await readBody(ephemeral.port)).to.eql(body);
      }));

    it(`${name}: config add validates the flag before writing and defaults omitted ports`, () =>
      Testing.withTmpDir(async (cwd) => {
        const flags = ['config', 'add', '--config', config];
        const path = Fs.join(cwd, config);
        const yaml = async () => (await Fs.readText(path)).data;
        const doc = async () => Yaml.parse((await yaml()) ?? '').data;
        expect(await cli(cwd, [...flags, '--port=49152', '--strict-port=false'])).to.eql(0);
        expect(await doc()).to.include({ port: 49152, strictPort: false });

        const before = await yaml();
        const invalid = [
          ['--strict-port=FALSE'],
          ['--strict-port='],
          ['--strict-port', '--strict-port=false'],
        ];
        for (const tokens of invalid) {
          expect(await cli(cwd, [...flags, ...tokens])).not.to.eql(0);
          expect(await yaml()).to.eql(before);
        }

        expect(await cli(cwd, [...flags, '--strict-port'])).to.eql(0);
        expect(await doc()).to.include({ port: 4040, strictPort: true });
        expect(await cli(cwd, [...flags, '--strict-port=true', '--port=0'])).to.eql(0);
        expect(await doc()).to.include({ port: 0, strictPort: true });
      }));

    it(`${name}: rejects a quoted strictPort boolean in YAML`, () =>
      Testing.withTmpDir(async (cwd) => {
        const fields = name === 'static' ? 'dir: .' : 'mounts: []';
        const text = Str.dedent(`
          name: ${name}
          hostname: ${hostname}
          port: 0
          strictPort: 'false'
          ${fields}
        `);
        await Fs.write(Fs.join(cwd, config), text);
        await expectError(async () => {
          await using _server = await endpoint.start({ cwd, paths: { config }, silent: true });
        }, "config key 'strictPort' must be a boolean");
      }));
  }
});
