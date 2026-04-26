import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { DepAudit } from '../u.depAudit.react.ts';

describe('Vite.DepAudit', () => {
  it('reports a mixed-authority duplicate React wrapper graph', async () => {
    const fs = await fixture.auditWorld('Vite.DepAudit.mixed.');
    try {
      // NB: synthetic optimize-deps metadata paths; version text is fixture-only.
      await fixture.metadata(fs.cwd, {
        react: {
          src:
            '../../../../../../node_modules/.deno/react@0.0.0-fixture/node_modules/react/index.js',
          file: 'react.js',
          needsInterop: true,
        },
        'react-dom': {
          src:
            '../../../../../../node_modules/.deno/react-dom@0.0.0-fixture/node_modules/react-dom/index.js',
          file: 'react-dom.js',
          needsInterop: true,
        },
        'react-dom/client': {
          src:
            '../../../../../../node_modules/.deno/react-dom@0.0.0-fixture/node_modules/react-dom/client.js',
          file: 'react-dom_client.js',
          needsInterop: true,
        },
        'react-inspector': {
          src:
            '../../.deno/react-inspector@0.0.0-fixture/node_modules/react-inspector/dist/index.js',
          file: 'react-inspector.js',
          needsInterop: false,
        },
      });
      await fixture.file(fs.cwd, 'react.js', 'export {}\n');
      await fixture.file(fs.cwd, 'react-CR4G_dzg.js', 'export {}\n');
      await fixture.file(
        fs.cwd,
        'react-dom_client.js',
        'import { t as require_react } from "./react.js";\n',
      );
      await fixture.file(
        fs.cwd,
        'react-dom.js',
        'import { t as require_react } from "./react.js";\n',
      );
      await fixture.file(
        fs.cwd,
        'react-inspector.js',
        'import { t as require_react } from "./react-CR4G_dzg.js";\n',
      );

      const res = await DepAudit.reactSingletons(fs.cwd);

      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('expected audit result');
      expect(res.mixedAuthority).to.eql(true);
      expect(res.duplicateWrapper).to.eql(true);
      expect(res.divergentConsumers).to.eql(true);
      expect(res.wrappers).to.eql(['react-CR4G_dzg.js', 'react.js']);
      expect(res.consumers['react-dom/client']).to.eql('react.js');
      expect(res.consumers['react-inspector']).to.eql('react-CR4G_dzg.js');
      expect(res.entries.react.authority).to.eql('external');
      expect(res.entries['react-inspector'].authority).to.eql('consumer');
    } finally {
      await Fs.remove(fs.root);
    }
  });

  it('reports a collapsed single-wrapper graph cleanly', async () => {
    const fs = await fixture.auditWorld('Vite.DepAudit.clean.');
    try {
      await fixture.metadata(fs.cwd, {
        react: {
          src: '../../.deno/react@0.0.0-fixture/node_modules/react/index.js',
          file: 'react.js',
          needsInterop: true,
        },
        'react-dom': {
          src: '../../.deno/react-dom@0.0.0-fixture/node_modules/react-dom/index.js',
          file: 'react-dom.js',
          needsInterop: true,
        },
        'react-inspector': {
          src:
            '../../.deno/react-inspector@0.0.0-fixture/node_modules/react-inspector/dist/index.js',
          file: 'react-inspector.js',
          needsInterop: false,
        },
      });
      await fixture.file(fs.cwd, 'react.js', 'export {}\n');
      await fixture.file(
        fs.cwd,
        'react-dom.js',
        'import { t as require_react } from "./react.js";\n',
      );
      await fixture.file(
        fs.cwd,
        'react-inspector.js',
        'import { t as require_react } from "./react.js";\n',
      );

      const res = await DepAudit.reactSingletons(fs.cwd);

      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('expected audit result');
      expect(res.mixedAuthority).to.eql(false);
      expect(res.duplicateWrapper).to.eql(false);
      expect(res.divergentConsumers).to.eql(false);
      expect(res.wrappers).to.eql(['react.js']);
      expect(res.consumers['react-dom']).to.eql('react.js');
      expect(res.consumers['react-inspector']).to.eql('react.js');
      expect(res.entries.react.authority).to.eql('consumer');
      expect(res.entries['react-inspector'].authority).to.eql('consumer');
    } finally {
      await Fs.remove(fs.root);
    }
  });
});

const fixture = {
  async auditWorld(prefix: string) {
    const fs = await Fs.makeTempDir({ prefix });
    const root = await Fs.realPath(fs.absolute);
    const cwd = Path.join(root, 'code', 'app');
    const depsDir = Path.join(cwd, 'node_modules', '.vite', 'deps');
    await Fs.ensureDir(Path.join(cwd, 'node_modules', '.deno'));
    await Fs.ensureDir(Path.join(root, 'node_modules', '.deno'));
    await Fs.ensureDir(depsDir);
    return { root, cwd, depsDir } as const;
  },

  async metadata(
    cwd: string,
    optimized: Record<string, { src: string; file: string; needsInterop: boolean }>,
  ) {
    const path = Path.join(cwd, 'node_modules', '.vite', 'deps', '_metadata.json');
    await Fs.writeJson(path, { optimized });
  },

  async file(cwd: string, name: string, text: string) {
    const path = Path.join(cwd, 'node_modules', '.vite', 'deps', name);
    await Fs.write(path, text);
  },
} as const;
