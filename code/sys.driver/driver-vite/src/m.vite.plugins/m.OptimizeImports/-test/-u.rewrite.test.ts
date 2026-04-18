import { describe, expect, it, Str } from '../../../-test.ts';
import { rewriteImports } from '../u.rewrite.ts';

describe('OptimizeImportsPlugin.rewriteImports', () => {
  const rules = [
    {
      packageId: '@sys/ui-react-devharness',
      imports: [
        { importName: 'useKeyboard', subpath: './hooks', kind: 'value' },
        { importName: 'useRubberband', subpath: './hooks', kind: 'value' },
        { importName: 'HookSpec', subpath: './hooks', kind: 'type' },
        { importName: 'KeyboardEventSpec', subpath: './hooks', kind: 'both' },
      ],
    },
  ] as const;

  it('rewrites an approved named import to a public subpath', () => {
    const input = "import { useKeyboard } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql("import { useKeyboard } from '@sys/ui-react-devharness/hooks';");
  });

  it('groups multiple approved imports targeting the same subpath', () => {
    const input = "import { useKeyboard, useRubberband } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql(
      "import { useKeyboard, useRubberband } from '@sys/ui-react-devharness/hooks';",
    );
  });

  it('preserves unknown imports on the broad package root', () => {
    const input = "import { Dev, useKeyboard } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql(Str.dedent(`
      import { useKeyboard } from '@sys/ui-react-devharness/hooks';
      import { Dev } from '@sys/ui-react-devharness';
    `));
  });

  it('leaves unknown imports unchanged', () => {
    const input = "import { Dev } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(false);
    expect(result.code).to.eql(input);
  });

  it('preserves aliases when rewriting', () => {
    const input = "import { useKeyboard as useDevKeyboard } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql(
      "import { useKeyboard as useDevKeyboard } from '@sys/ui-react-devharness/hooks';",
    );
  });

  it('leaves default imports unchanged', () => {
    const input = "import Dev, { useKeyboard } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(false);
    expect(result.code).to.eql(input);
  });

  it('leaves namespace imports unchanged', () => {
    const input = "import * as DevHarness from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(false);
    expect(result.code).to.eql(input);
  });

  it('keeps type-only imports on the root when only value rewrites are approved', () => {
    const input = "import type { useKeyboard } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(false);
    expect(result.code).to.eql(input);
  });

  it('rewrites mixed value and type specifiers with per-kind behavior', () => {
    const input = "import { type HookSpec, useKeyboard, Dev } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql(Str.dedent(`
      import { useKeyboard } from '@sys/ui-react-devharness/hooks';
      import type { HookSpec } from '@sys/ui-react-devharness/hooks';
      import { Dev } from '@sys/ui-react-devharness';
    `));
  });

  it('rewrites whole-declaration import type when a type rule exists', () => {
    const input = "import type { HookSpec } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql("import type { HookSpec } from '@sys/ui-react-devharness/hooks';");
  });

  it('rewrites whole-declaration import type when a both-kind rule exists', () => {
    const input = "import type { KeyboardEventSpec } from '@sys/ui-react-devharness';";
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql(
      "import type { KeyboardEventSpec } from '@sys/ui-react-devharness/hooks';",
    );
  });

  it('rewrites formatted multi-line declarations', () => {
    const input = Str.dedent(`
      import {
        useKeyboard,
        Dev,
      } from '@sys/ui-react-devharness';
    `);
    const result = rewriteImports(input, rules);

    expect(result.changed).to.eql(true);
    expect(result.code).to.eql(Str.dedent(`
      import { useKeyboard } from '@sys/ui-react-devharness/hooks';
      import { Dev } from '@sys/ui-react-devharness';
    `));
  });
});
