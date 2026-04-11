import { describe, expect, it } from '@sys/testing/server';
import { bumpOrderedPaths, dependentClosure, main, orderChildren, postBumpPackageSyncArgs, postBumpPrepArgs } from '../task.bump.ts';

describe('scripts/task.bump', () => {
  it('orders bump rows by topological workspace package path order', () => {
    const children = [
      { path: 'code/sys/workspace/deno.json', name: '@sys/workspace' },
      { path: 'code/sys/std/deno.json', name: '@sys/std' },
      { path: 'code/sys/types/deno.json', name: '@sys/types' },
    ];

    const res = orderChildren(children, [
      'code/sys/types',
      'code/sys/std',
      'code/sys/workspace',
    ]);

    expect(res.map((child) => child.name)).to.eql([
      '@sys/types',
      '@sys/std',
      '@sys/workspace',
    ]);
  });

  it('keeps unmatched children at the end in stable path order', () => {
    const children = [
      { path: 'code/sys/workspace/deno.json', name: '@sys/workspace' },
      { path: 'code/extra/zeta/deno.json', name: '@extra/zeta' },
      { path: 'code/sys/std/deno.json', name: '@sys/std' },
      { path: 'code/extra/alpha/deno.json', name: '@extra/alpha' },
    ];

    const res = orderChildren(children, ['code/sys/std', 'code/sys/workspace']);

    expect(res.map((child) => child.name)).to.eql([
      '@sys/std',
      '@sys/workspace',
      '@extra/alpha',
      '@extra/zeta',
    ]);
  });

  it('includes generated tmpl coupling in the bump closure', () => {
    const res = dependentClosure('code/-tmpl', [], ['code/-tmpl', 'code/sys.tools']);

    expect(res).to.include('code/-tmpl');
    expect(res).to.include('code/sys.tools');
  });

  it('includes generated driver-agent coupling in the bump closure', () => {
    const res = dependentClosure('code/sys.driver/driver-agent', [], [
      'code/sys.driver/driver-agent',
      'code/sys.tools',
    ]);

    expect(res).to.include('code/sys.driver/driver-agent');
    expect(res).to.include('code/sys.tools');
  });

  it('reorders the bump picker paths to honor generated tmpl coupling', () => {
    const res = bumpOrderedPaths([
      'code/sys/std',
      'code/sys.tools',
      'code/-tmpl',
      'code/sys/workspace',
    ]);

    expect(res).to.eql([
      'code/sys/std',
      'code/-tmpl',
      'code/sys.tools',
      'code/sys/workspace',
    ]);
  });

  it('reorders the bump picker paths to honor generated driver-agent coupling', () => {
    const res = bumpOrderedPaths([
      'code/sys/std',
      'code/sys.tools',
      'code/sys.driver/driver-agent',
      'code/sys/workspace',
    ]);

    expect(res).to.eql([
      'code/sys/std',
      'code/sys.driver/driver-agent',
      'code/sys.tools',
      'code/sys/workspace',
    ]);
  });

  it('syncs package metadata before delegating to the canonical ahead-only prep lane', () => {
    expect(postBumpPackageSyncArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-pkg',
    ]);
    expect(postBumpPrepArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-all',
      '--ahead-only',
      '--prep-context=bump',
    ]);
  });

  it('renders bump help with release and from options', async () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      await main({ argv: ['--help'] });
    } finally {
      console.info = info;
    }

    const output = calls.join('\n');
    expect(output).to.include('deno task bump');
    expect(output).to.include('--release <patch|minor|major>');
    expect(output).to.include('--from <package-name|package-path>');
  });
});
