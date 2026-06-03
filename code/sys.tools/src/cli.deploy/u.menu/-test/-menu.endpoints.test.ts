import { Cli, describe, expect, Fs, it } from '../../../-test.ts';
import { EndpointsFs } from '../../u.endpoints/mod.ts';
import { endpointsMenu } from '../menu.endpoints.ts';
import { withTmpDir } from '../../-test/u.fixture.ts';

describe('Deploy: endpointsMenu', () => {
  it('endpoints menu → uses lowercase prompt and provider-kind labels', async () => {
    await withTmpDir(async (tmp) => {
      const dir = Fs.join(tmp, EndpointsFs.dir);
      await Fs.ensureDir(dir);
      await Fs.write(Fs.join(dir, 'cdn.yaml'), 'provider:\n  kind: orbiter\n');
      await Fs.write(Fs.join(dir, 'assets.yaml'), 'provider:\n  kind: r2\n');

      const original = Cli.Input.Select.prompt;
      let message = '';
      let seen: string[] = [];

      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (args: {
          readonly message: string;
          readonly options: readonly { readonly name: string }[];
        }) => {
          message = args.message;
          seen = args.options.map((option) => Cli.stripAnsi(option.name));
          return Promise.resolve('exit');
        },
      });

      try {
        const res = await endpointsMenu(tmp);

        expect(res).to.eql({ kind: 'exit' });
        expect(message).to.eql('endpoints:');
        expect(seen.some((name) => name.startsWith(' orbiter: '))).to.eql(true);
        expect(seen.some((name) => name.startsWith('      r2: '))).to.eql(true);
        expect(seen.some((name) => name.includes('deploy:'))).to.eql(false);
      } finally {
        Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      }
    });
  });
});
