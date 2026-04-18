import { describe, expect, it, Path } from '../../../-test.ts';
import { Fs } from '../../../fs/common.ts';
import { Yaml } from '@sys/yaml';

describe('sample-2.yaml.authored', () => {
  const root = Path.resolve(import.meta.dirname ?? '.');
  const fixture = Path.resolve(root, '..');
  const docsDir = Fs.join(fixture, 'docs');
  const rootMetaPath = Fs.join(fixture, '-root.yaml');

  it('is a trimmed but closed slug-dataset fixture', async () => {
    const meta = Yaml.parse<Record<string, unknown>>(
      String((await Fs.readText(rootMetaPath)).data ?? ''),
    ).data ?? {};
    const rootInfo = meta.root as { docid?: string; file?: string } | undefined;
    const sampleInfo = meta.sample as { docs?: number } | undefined;
    const rootPath = rootInfo?.file ? Fs.join(fixture, rootInfo.file) : '';

    expect(rootInfo?.docid).to.eql('21JvXzARPYFXDVMag3x4UhLgHcQi');
    expect(await Fs.exists(rootPath)).to.eql(true);

    const rootDoc = Yaml.parse<Record<string, unknown>>(
      String((await Fs.readText(rootPath)).data ?? ''),
    ).data ?? {};
    const data = (rootDoc.data ?? {}) as Record<string, unknown>;
    const progCore = data['prog.core'] as { tree?: unknown[] } | undefined;
    const progP2p = data['prog.p2p'] as { tree?: unknown[] } | undefined;

    expect(progCore?.tree?.length).to.eql(2);
    expect(progP2p?.tree?.length).to.eql(2);

    const paths = await Fs.ls(docsDir, { includeDirs: false, depth: 1 });
    const ids = new Set(
      paths
        .map((path: string) => Fs.basename(path))
        .map((name: string) => name.match(/^slug\.(.+)\.yaml$/)?.[1])
        .filter((value: string | undefined): value is string => Boolean(value)),
    );

    const refs = new Set<string>();
    const visit = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (key === 'ref' && typeof item === 'string') {
          const match = item.match(/^crdt:(.+)$/);
          if (match) refs.add(match[1]);
        }
        visit(item);
      }
    };

    for (const path of paths) {
      const doc = Yaml.parse<unknown>(String((await Fs.readText(path)).data ?? '')).data;
      visit(doc);
    }

    const missing = [...refs].filter((id) => !ids.has(id)).sort();
    expect(missing).to.eql([]);
    expect(ids.size).to.eql(sampleInfo?.docs ?? ids.size);
  });
});
