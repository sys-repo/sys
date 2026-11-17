import { describe, expect, Fs, Is, it, makeTmpl, Process, Str, Templates } from '../-test.ts';
import { TmplTesting } from '../m.testing/mod.ts';
import { makeWorkspace } from '../-tests/u.ts';

/** Generated modules use current workspace authorities, not published-consumer dependencies. */
describe('UI template: named scoped-style materialization', () => {
  it('Button / XMLPanel setup → typed roots, two rule blocks, and removable optional styling', async () => {
    const { root } = await makeWorkspace();
    const keep = Deno.args.includes('--keep');
    const browser = Deno.args.includes('--browser');
    const pkgDir = Fs.join(root, 'code/example');
    try {
      await (await makeTmpl('repo')).write(root, { force: true });
      await (await makeTmpl('pkg')).write(pkgDir);
      await (await Templates.pkg()).default(pkgDir, { pkgName: '@fixture/ui' });
      const tmpl = await makeTmpl('m.mod.ui');
      const setup = await Templates['m.mod.ui']();
      for (const name of ['Button', 'XMLPanel', 'DualRule', 'Plain']) {
        const target = Fs.join(pkgDir, 'src/ui', name);
        await tmpl.write(target);
        await setup.default(target, { name });
      }

      const dualDir = Fs.join(pkgDir, 'src/ui/DualRule');
      const helper = await readText(Fs.join(dualDir, 'use.Styles.ts'));
      expect(helper).to.include('  return styles;');
      const second = Str.dedent(`
        {
          const selector = 'mark';
          const key = Obj.hash([component, selector]);
          const names = { fg: \`--scoped-\${key}-fg\` } as const;
          useStylesheetRule(\`[data-component="\${component}"] \${selector}\`, {
            color: \`var(\${names.fg})\`,
          });
          Object.assign(styles, { [names.fg]: Color.alpha(theme.fg, 0.6) });
        }
      `);
      const dual = helper.replace('  return styles;', `${second}\n  return styles;`);
      await Fs.write(Fs.join(dualDir, 'use.Styles.ts'), dual);

      // Delete one complete rule-local block: the remaining example has no orphan bindings.
      const start = dual.indexOf('  // Example:');
      const end = dual.indexOf(second);
      expect(start).to.be.greaterThan(-1);
      expect(end).to.be.greaterThan(start);
      const onlyMark = dual.slice(0, start) + dual.slice(end);
      await Fs.write(Fs.join(dualDir, 'use.OnlyMark.ts'), onlyMark);

      // Delete the optional helper and its three UI touchpoints, preserving ordinary root styling.
      const plainDir = Fs.join(pkgDir, 'src/ui/Plain');
      const plain = await readText(Fs.join(plainDir, 'ui.tsx'));
      const without = plain
        .replace("import { useScopedStyles } from './use.Styles.ts';\n", '')
        .replace(/^ {2}const scoped = useScopedStyles.*\n/m, '')
        .replace('css(styles.base, scoped, props.style)', 'css(styles.base, props.style)');
      expect(without).not.to.eql(plain);
      await Fs.write(Fs.join(plainDir, 'ui.tsx'), without);
      await Fs.remove(Fs.join(plainDir, 'use.Styles.ts'));

      const testPath = Fs.join(pkgDir, 'src/-test/-scoped-styles.test.tsx');
      await Fs.write(testPath, generatedTest);
      await writeBrowserFixture(pkgDir);
      await TmplTesting.LocalRepoAuthorities.rewrite({ root });
      await invoke(pkgDir, ['task', 'test', '--trace-leaks', 'src/-test/-scoped-styles.test.tsx']);
      // Check the actual generated roots (and their imported barrels) in the owning generated task.
      await invoke(pkgDir, ['task', 'check']);
      if (keep || browser) await invoke(pkgDir, ['task', 'build']);
      if (browser) {
        const result = await invoke(pkgDir, ['task', 'test:styles:browser']);
        console.info(result.text.stdout);
      }
    } finally {
      if (keep) console.info(`Retained scoped-style fixture: ${pkgDir}`);
      else await Fs.remove(root);
    }
  });
});

/**
 * Helpers:
 */
async function writeBrowserFixture(pkgDir: string) {
  const files = ['common.ts', 'ui.tsx', 'u.baseline.tsx', 'u.fixture.tsx', 'u.report.ts'];
  for (const file of files) {
    await Fs.copy(
      Fs.join(import.meta.dirname!, 'styles.browser', file),
      Fs.join(pkgDir, 'src/-test/styles.browser', file),
    );
  }

  // Extend only this generated example's normal entry; production templates stay untouched.
  const path = Fs.join(pkgDir, 'src/-test/entry.tsx');
  const source = await readText(path);
  const anchor = '  if (isDev) {';
  expect(source.split(anchor).length).to.eql(2);
  const branch = Str.dedent(`
    if (params.has('styles')) {
      const { StylesProof } = await import('./styles.browser/ui.tsx');
      const { XMLPanel } = await import('../ui/XMLPanel/mod.ts');
      document.body.style.overflow = 'auto';
      root.render(<React.StrictMode><StylesProof UI={XMLPanel.UI} /></React.StrictMode>);
      return;
    }
  `);
  await Fs.write(path, source.replace(anchor, `${branch}\n${anchor}`));
  await Fs.write(Fs.join(pkgDir, 'src/-test/-scoped-styles.browser.ts'), browserTest);

  // Localized @sys sources sit outside this temporary repo. Resolve their React imports from
  // the consumer too, using Vite's standard linked-package dedupe (not a second React runtime).
  const configPath = Fs.join(pkgDir, 'vite.config.ts');
  const config = await readText(configPath);
  for (const anchor of ['Vite.Config.define(() => {', 'return Vite.Config.app({', '  });\n});']) {
    expect(config.split(anchor).length, `Generated Vite config anchor: ${anchor}`).to.eql(2);
  }
  await Fs.write(
    configPath,
    config
      .replace('Vite.Config.define(() => {', 'Vite.Config.define(async () => {')
      .replace('return Vite.Config.app({', 'const app = await Vite.Config.app({')
      .replace(
        '  });\n});',
        `  });\n  return { ...app, resolve: { ...app.resolve, dedupe: ['react', 'react-dom'] } };\n});`,
      ),
  );

  // Opt-in only: use this generated package's existing dev authority for loopback + Chrome.
  const manifestPath = Fs.join(pkgDir, 'deno.json');
  const manifest = await readText(manifestPath);
  const task = '"test": "deno test -P=test",';
  expect(manifest.split(task).length).to.eql(2);
  await Fs.write(
    manifestPath,
    manifest.replace(
      task,
      `${task}\n    "test:styles:browser": "deno test -P=dev --trace-leaks src/-test/-scoped-styles.browser.ts",`,
    ),
  );
}

async function readText(path: string) {
  const res = await Fs.readText(path);
  if (!Is.str(res.data)) throw new Error(`Failed to read ${path}`, { cause: res.error });
  return res.data;
}

async function invoke(cwd: string, args: string[]) {
  const res = await Process.invoke({ cmd: 'deno', args, cwd, silent: true });
  if (!res.success) {
    throw new Error(
      `Generated verification failed (${res.code}):\n${res.text.stdout}\n${res.text.stderr}`,
    );
  }
  return res;
}

const browserTest = Str.dedent(`
  import { Browser, expect, it, Testing } from '@sys/testing/server';
  import { DistServer } from '@sys/server/dist/server';
  import { Fs } from '@sys/fs';
  import { Is } from '@sys/std/is';
  import type { Report } from './styles.browser/u.report.ts';

  it('generated XMLPanel → browser loading and all 56 complete computed-style comparisons', async () => {
    let proof: Report | undefined;
    const receiver = Testing.Http.server(async (request) => {
      if (request.method !== 'POST') return new Response(null, { status: 405 });
      proof = await request.json();
      return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*' } });
    });
    try {
      // Same verified-Dist transport as the generated package's normal serve task.
      const app = await DistServer.Local.start({
        dir: await Fs.realPath('./dist'),
        hostname: '127.0.0.1',
        silent: true,
        limits: {
          manifestBytes: 1024 * 1024,
          entries: 512,
          fileBytes: 16 * 1024 * 1024,
          totalBytes: 64 * 1024 * 1024,
        },
      });
      try {
        const url = new URL(app.origin);
        url.searchParams.set('styles', '');
        url.searchParams.set('proof', receiver.url.raw);
        const loaded = await Browser.load(url.href, {
          waitAfterLoad: 15_000,
          allowError: (text) => text.includes('404') && text.endsWith('/favicon.ico'),
        });
        expect(loaded.errors, loaded.errors.join('\\n')).to.eql([]);
        expect(loaded.ok).to.eql(true);
        expect(proof, proof?.error).to.include({ result: 'PASS — computed styles; visual review still required' });
        if (Is.nil(proof)) throw new Error('Missing completed browser report');
        expect(proof.browserVersion).to.eql(null);
        expect(proof.comparisons).to.have.length(56);
        expect(proof.failures).to.eql([]);
        const properties = [
          'color', 'background-color', 'font-family', 'font-weight', 'font-size', 'line-height',
          'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
          'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
          'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
          'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
          'border-top-left-radius', 'border-top-right-radius',
          'border-bottom-right-radius', 'border-bottom-left-radius',
        ];
        const counts = new Map<string, number>();
        const identities = new Set<string>();
        for (const item of proof.comparisons) {
          expect(item).to.be.an('object');
          expect(item.phase).to.be.a('string').and.not.empty;
          expect(item.id).to.be.a('string').and.not.empty;
          expect(item.key).to.match(/^(Light|Dark)\\/(none|root|intermediate|direct)$/);
          expect(item.differences).to.eql([]);
          for (const values of [item.actual, item.baseline]) {
            expect(values).to.be.an('object').with.all.keys(properties);
            for (const value of Object.values(values)) expect(value).to.be.a('string').and.not.empty;
          }
          expect(item.actual).to.eql(item.baseline);
          counts.set(item.phase, (counts.get(item.phase) ?? 0) + 1);
          identities.add(item.phase + '/' + item.id);
        }
        expect(identities.size).to.eql(56);
        expect(Object.fromEntries(counts)).to.eql({
          'isolated Light': 4,
          'Light then Dark': 8,
          'isolated Dark (remount)': 4,
          'Dark then Light': 8,
          'transition → Light': 4,
          'transition → Dark': 4,
          'transition → Light again': 4,
          'Light remount': 4,
          'nested Light / Dark': 8,
          'nested Dark / Light': 8,
        });
        console.info('Chrome: 56 complete computed comparisons passed; visual acceptance remains open.', proof.userAgent);
      } finally {
        await app.dispose();
      }
    } finally {
      await receiver.dispose();
    }
  });
`);

const generatedTest = Str.dedent(`
  import React from 'react';
  import { describe, expect, it } from '@sys/testing/server';
  import { TestReact } from '@sys/ui-react/testing/server';
  import { Color, css, Style } from '../ui/common.ts';
  import { Button } from '../ui/Button/mod.ts';
  import { XMLPanel } from '../ui/XMLPanel/mod.ts';
  import { Plain } from '../ui/Plain/mod.ts';
  import { D as ButtonD } from '../ui/Button/common.ts';
  import { D as XMLD } from '../ui/XMLPanel/common.ts';
  import { useScopedStyles as useDual } from '../ui/DualRule/use.Styles.ts';
  import { useScopedStyles as useOnlyMark } from '../ui/DualRule/use.OnlyMark.ts';

  describe('Generated scoped styles', () => {
    const cases = [
      { UI: Button.UI, identity: ButtonD, name: 'Button' },
      { UI: XMLPanel.UI, identity: XMLD, name: 'XMLPanel' },
    ] as const;
    for (const { UI, identity, name } of cases) {
      it(name + ' → canonical display name and serialized bindings', async () => {
        const displayName = '@fixture/ui:' + name;
        expect(identity.name).to.eql(name);
        expect(identity.displayName).to.eql(displayName);
        using rendered = await TestReact.render(<UI theme='Dark' />);
        const root = rendered.container.querySelector('[data-component]')!;
        expect(root.getAttribute('data-component')).to.eql(displayName);
        const rules = Style.Dom.stylesheet().rules.items;
        const descendant = rules.find((item) => item.selector === '[data-component="' + displayName + '"] code')!;
        const refs = Array.from(descendant.rule.matchAll(/var\\((--[^)]+)\\)/g), (match) => match[1]);
        expect(refs.length).to.eql(3);
        const rootText = rules.filter((item) => root.matches(item.selector)).map((item) => item.rule).join('\\n');
        for (const ref of refs) expect(rootText).to.include(ref + ': ');
        expect(rootText).to.include(Color.alpha(Color.theme('Dark').fg, 0.8));
      });
    }

    it('two static blocks → independent selector namespaces; deleting one removes only its values', async () => {
      let all: string[] = [];
      let remaining: string[] = [];
      function Dual() {
        const styles = useDual({ component: '@fixture/ui:DualRule', theme: Color.theme('Light') });
        all = Object.keys(styles);
        return <div data-component='@fixture/ui:DualRule' className={css(styles).class}><code>code</code><mark>mark</mark></div>;
      }
      function Remaining() {
        const styles = useOnlyMark({ component: '@fixture/ui:OnlyMark', theme: Color.theme('Dark') });
        remaining = Object.keys(styles);
        return <div data-component='@fixture/ui:OnlyMark' className={css(styles).class}><mark>remaining</mark></div>;
      }
      using rendered = await TestReact.render(<><Dual /><Remaining /></>);
      expect(all.length).to.eql(4);
      expect(new Set(all).size).to.eql(4);
      expect(remaining.length).to.eql(1);
      const rules = Style.Dom.stylesheet().rules.items;
      const emitted = rules.filter((item) => item.selector.startsWith('[data-component="@fixture/ui:DualRule"]'));
      expect(emitted.map((item) => item.selector)).to.eql([
        '[data-component="@fixture/ui:DualRule"] code',
        '[data-component="@fixture/ui:DualRule"] mark',
      ]);
      const refs = emitted.map((item) => Array.from(item.rule.matchAll(/var\\((--[^)]+)\\)/g), (match) => match[1]));
      expect(refs[1].some((ref) => refs[0].includes(ref))).to.eql(false);
      expect(refs.flat().every((ref) => all.includes(ref))).to.eql(true);
      const kept = rules.filter((item) => item.selector.startsWith('[data-component="@fixture/ui:OnlyMark"]'));
      expect(kept.map((item) => item.selector)).to.eql(['[data-component="@fixture/ui:OnlyMark"] mark']);
      expect(kept[0].rule).to.include('var(' + remaining[0] + ')');
    });

    it('helper deletion → usable production identity and caller-last root styling', async () => {
      using rendered = await TestReact.render(<Plain.UI theme='Light' style={{ color: 'tomato' }} />);
      const root = rendered.container.querySelector('[data-component]')!;
      expect(root.getAttribute('data-component')).to.eql('@fixture/ui:Plain');
      const rules = Style.Dom.stylesheet().rules.items;
      const rootText = rules.filter((item) => root.matches(item.selector)).map((item) => item.rule).join('\\n');
      expect(rootText).to.include('color: tomato;');
      expect(rootText).to.include('padding: 10px;');
      expect(rules.filter((item) => item.selector === '[data-component="@fixture/ui:Plain"] code')).to.eql([]);
    });
  });
`);
