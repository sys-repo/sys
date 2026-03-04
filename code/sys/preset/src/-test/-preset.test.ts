import { describe, it, expect } from '@sys/testing/server';

describe('root: @sys/preset', () => {
  it('mod.ts → imports all preset surfaces', async () => {
    const m = await import('../mod.ts');
    expect(m).to.exist;
    expect('Css' in m).to.eql(true);
    expect('Testing' in m).to.eql(true);
    expect('Std' in m).to.eql(true);
    expect('DriverVite' in m).to.eql(true);
    expect('Ext' in m).to.eql(true);
  });
});

describe('namespace: @sys', () => {
  it('sys.core → imports', async () => {
    const m = await import('../m.core.ts');
    expect(m).to.exist;
    expect('Fs' in m).to.eql(true);
    expect('Process' in m).to.eql(true);
    expect('Std' in m).to.eql(true);
  });

  it('sys.testing → imports', async () => {
    const m = await import('../m.testing.ts');
    expect(m).to.exist;
    expect('Testing' in m).to.eql(true);
    expect('Server' in m).to.eql(true);
  });

  it('sys.ui → imports', async () => {
    const m = await import('../m.ui.ts');
    expect(m).to.exist;
    expect('Css' in m).to.eql(true);
    expect('Dom' in m).to.eql(true);
    expect('React' in m).to.eql(true);
    expect('Components' in m).to.eql(true);
    expect('DevHarness' in m).to.eql(true);
  });

  it('sys.build → imports', async () => {
    const m = await import('../m.build.ts');
    expect(m).to.exist;
    expect('DriverVite' in m).to.eql(true);
    expect('DriverViteEntry' in m).to.eql(true);
  });
});

describe('ext (external)', () => {
  it('ext → rollup imports', async () => {
    const m = await import('../m.ext.ts');
    expect(m).to.exist;
    expect('React' in m).to.eql(true);
    expect('Vite' in m).to.eql(true);
  });

  it('ext/react → imports', async () => {
    const m = await import('../m.ext.react.ts');
    expect(m).to.exist;
    expect('React' in m).to.eql(true);
    expect('ReactDom' in m).to.eql(true);
    expect('ReactIcons' in m).to.eql(true);
  });

  it('ext/build → imports', async () => {
    const m = await import('../m.ext.build.ts');
    expect(m).to.exist;
    expect('Vite' in m).to.eql(true);
    expect('VitePluginDeno' in m).to.eql(true);
    expect('VitePluginReact' in m).to.eql(true);
    expect('VitePluginWasm' in m).to.eql(true);
    expect('Rollup' in m).to.eql(true);
    expect('RollupVisualizer' in m).to.eql(true);
  });
});
