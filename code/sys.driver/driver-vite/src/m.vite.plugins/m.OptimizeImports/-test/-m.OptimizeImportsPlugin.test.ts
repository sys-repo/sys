import { describe, expect, Is, it } from '../../../-test.ts';
import { OptimizeImportsPlugin } from '../mod.ts';

const TEST_RULES = [{
  packageId: '@sys/ui-react-devharness',
  imports: [{ importName: 'useKeyboard', subpath: './hooks', kind: 'value' as const }],
}] as const;

describe('OptimizeImportsPlugin', () => {
  it('API', () => {
    const plugin = OptimizeImportsPlugin.plugin();
    expect(plugin.name).to.eql('sys:optimize-imports');
    expect(plugin.enforce).to.eql('pre');
  });

  it('transform rewrites supported imports in target source files', async () => {
    const plugin = OptimizeImportsPlugin.plugin({ packages: TEST_RULES });
    const transform = asTransform(plugin.transform);
    const result = await transform(
      "import { useKeyboard } from '@sys/ui-react-devharness';",
      '/tmp/mod.ts',
    );

    expect(Is.object(result)).to.eql(true);
    if (!result || typeof result === 'string') throw new Error('Expected transform result object');
    expect(result.code).to.eql("import { useKeyboard } from '@sys/ui-react-devharness/hooks';");
    expect(result.map).to.eql(null);
  });

  it('transform ignores unsupported files and untouched code', async () => {
    const plugin = OptimizeImportsPlugin.plugin({ packages: TEST_RULES });
    const transform = asTransform(plugin.transform);

    const a = await transform("import { useKeyboard } from '@sys/ui-react-devharness';", '/tmp/mod.css');
    const b = await transform("import { Dev } from '@sys/ui-react-devharness';", '/tmp/mod.ts');
    const c = await transform("import { useKeyboard } from '@sys/ui-react-devharness';", '/tmp/node_modules/pkg/mod.ts');

    expect(a).to.eql(null);
    expect(b).to.eql(null);
    expect(c).to.eql(null);
  });
});

function asTransform(transform: unknown) {
  if (!transform) throw new Error('Expected transform hook');
  if (typeof transform === 'function') return transform;
  if (Is.object(transform) && 'handler' in transform) {
    const handler = transform.handler;
    if (typeof handler === 'function') return handler;
  }
  throw new Error('Expected callable transform hook');
}
