import { describe, expect, it } from '../../../-test.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { endpointsMenuWith } from '../menu.endpoints.ts';

describe('Deploy: endpointsMenu', () => {
  it('configures lowercase endpoint labels from provider kinds', async () => {
    let label = '';
    let seen: string[] = [];
    const menu: typeof YamlConfig.menu = async (args) => {
      label = args.label;
      const itemLabel = args.itemLabel;
      if (typeof itemLabel === 'function') {
        seen = [
          itemLabel({ doc: { provider: { kind: 'orbiter' } } } as never),
          itemLabel({ doc: { provider: { kind: 'r2' } } } as never),
        ];
      }
      return { kind: 'exit' };
    };

    const res = await endpointsMenuWith('/tmp', menu);

    expect(res).to.eql({ kind: 'exit' });
    expect(label).to.eql('endpoints');
    expect(seen).to.eql(['orbiter', 'r2']);
  });
});
