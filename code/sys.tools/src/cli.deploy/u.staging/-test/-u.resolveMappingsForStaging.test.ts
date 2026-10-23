import { describe, expect, Fs, it } from '../../../-test.ts';
import { withTmpDir } from '../../-test/u.fixture.ts';
import { resolveMappingsForStaging } from '../u.resolveMappingsForStaging.ts';

describe('Deploy: resolveMappingsForStaging', () => {
  it('expands shard templates when configured', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/video/partition-0`);
      await Fs.ensureDir(`${tmp}/src/video/partition-1`);
      await Fs.ensureDir(`${tmp}/src/video/partition-2`);

      const res = await resolveMappingsForStaging({
        cwd: tmp,
        yamlPath: './noop.yaml',
        yaml: {
          source: { dir: './src' },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              shards: { total: 3 },
              dir: {
                source: './video/partition-<shard>',
                staging: './<shard>.video.cdn.example',
              },
            },
          ],
        },
      });

      expect(res.ok).to.eql(true);
      expect(res.mappings.length).to.eql(3);
      expect(res.mappings[0]?.dir.source).to.eql('./video/partition-0');
      expect(res.mappings[0]?.dir.staging).to.eql('./0.video.cdn.example');
      expect(res.mappings[2]?.dir.source).to.eql('./video/partition-2');
      expect(res.mappings[2]?.dir.staging).to.eql('./2.video.cdn.example');
    });
  });

  it('leaves templates literal without shard config', async () => {
    const res = await resolveMappingsForStaging({
      cwd: '/tmp',
      yamlPath: './noop.yaml',
      yaml: {
        staging: { dir: './staging' },
        mappings: [
          {
            mode: 'copy',
            dir: {
              source: './video/partition-<shard>',
              staging: './<shard>.video.cdn.example',
            },
          },
        ],
      },
    });

    expect(res.ok).to.eql(true);
    expect(res.mappings.length).to.eql(1);
    expect(res.mappings[0]?.dir.source).to.eql('./video/partition-<shard>');
    expect(res.mappings[0]?.dir.staging).to.eql('./<shard>.video.cdn.example');
  });

  it('rejects invalid configured numeric shard totals', async () => {
    const invalid = [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity];

    for (const total of invalid) {
      const res = await resolveMappingsForStaging({
        cwd: '/tmp',
        yamlPath: './noop.yaml',
        yaml: {
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              shards: { total },
              dir: {
                source: './source-<shard>',
                staging: './target-<shard>',
              },
            },
          ],
        },
      });

      expect(res.ok).to.eql(false);
      expect(res.mappings).to.eql([]);
    }
  });

  it('rejects missing and malformed shard totals read from YAML', async () => {
    await withTmpDir(async (tmp) => {
      const fixtures = {
        missing: [
          'staging:\n  dir: ./staging',
          'mappings:',
          '  - mode: copy',
          '    shards: {}',
          '    dir:',
          '      source: ./source-<shard>',
          '      staging: ./target-<shard>',
        ].join('\n'),
        string: [
          'staging:\n  dir: ./staging',
          'mappings:',
          '  - mode: copy',
          '    shards:',
          '      total: three',
          '    dir:',
          '      source: ./source-<shard>',
          '      staging: ./target-<shard>',
        ].join('\n'),
      };

      for (const [name, yaml] of Object.entries(fixtures)) {
        const yamlPath = `./${name}.yaml`;
        await Fs.write(`${tmp}/${name}.yaml`, yaml);

        const res = await resolveMappingsForStaging({ cwd: tmp, yamlPath });
        expect(res.ok).to.eql(false);
        expect(res.mappings).to.eql([]);
      }
    });
  });

  it('does not expand when no templates are present', async () => {
    const res = await resolveMappingsForStaging({
      cwd: '/tmp',
      yamlPath: './noop.yaml',
      yaml: {
        staging: { dir: './staging' },
        mappings: [
          {
            mode: 'copy',
            shards: { total: 5 },
            dir: {
              source: './video/program',
              staging: './video.cdn.example',
            },
          },
        ],
      },
    });

    expect(res.ok).to.eql(true);
    expect(res.mappings.length).to.eql(1);
    expect(res.mappings[0]?.dir.source).to.eql('./video/program');
    expect(res.mappings[0]?.dir.staging).to.eql('./video.cdn.example');
  });

  it('filters missing shard sources when requireAll is false', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      await Fs.ensureDir(`${src}/video/partition-0`);
      await Fs.ensureDir(`${src}/video/partition-2`);

      const res = await resolveMappingsForStaging({
        cwd: tmp,
        yamlPath: './noop.yaml',
        yaml: {
          source: { dir: './src' },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              shards: { total: 3 },
              dir: {
                source: './video/partition-<shard>',
                staging: './<shard>.video.cdn.example',
              },
            },
          ],
        },
      });

      expect(res.ok).to.eql(true);
      expect(res.mappings.length).to.eql(2);
      expect(res.mappings[0]?.dir.source).to.eql('./video/partition-0');
      expect(res.mappings[1]?.dir.source).to.eql('./video/partition-2');
    });
  });

  it('filters sparse index shards against standard staging outputs', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/site-0`);
      await Fs.ensureDir(`${tmp}/src/site-2`);

      const res = await resolveMappingsForStaging({
        cwd: tmp,
        yamlPath: './noop.yaml',
        yaml: {
          source: { dir: './src' },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              shards: { total: 3 },
              dir: { source: './site-<shard>', staging: './nested/<shard>' },
            },
            {
              mode: 'index',
              shards: { total: 3 },
              dir: { source: './nested/<shard>', staging: './landing/<shard>' },
            },
          ],
        },
      });

      expect(res.ok).to.eql(true);
      expect(res.mappings.map((mapping) => mapping.mode)).to.eql([
        'copy',
        'copy',
        'index',
        'index',
      ]);
      expect(res.mappings.map((mapping) => mapping.dir.source)).to.eql([
        './site-0',
        './site-2',
        './nested/0',
        './nested/2',
      ]);
    });
  });

  it('retains only sparse index sources guaranteed by produced directory roots', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/site-0`);

      const resolve = (
        produced: string,
        indexSource: string,
        requireAll = false,
      ) =>
        resolveMappingsForStaging({
          cwd: tmp,
          yamlPath: './noop.yaml',
          yaml: {
            source: { dir: './src' },
            staging: { dir: './staging' },
            mappings: [
              {
                mode: 'copy',
                shards: { total: 1 },
                dir: { source: './site-<shard>', staging: produced },
              },
              {
                mode: 'index',
                shards: { total: 1, requireAll },
                dir: { source: indexSource, staging: './landing/<shard>' },
              },
            ],
          },
        });

      const exact = await resolve('./nested/<shard>', './nested/<shard>');
      const ancestor = await resolve('./nested/<shard>/leaf', './nested/<shard>');
      const missingDescendant = await resolve(
        './nested/<shard>',
        './nested/<shard>/missing',
      );
      const requiredDescendant = await resolve(
        './nested/<shard>',
        './nested/<shard>/missing',
        true,
      );

      expect(exact.mappings.map((mapping) => mapping.mode)).to.eql(['copy', 'index']);
      expect(ancestor.mappings.map((mapping) => mapping.mode)).to.eql(['copy', 'index']);
      expect(missingDescendant.mappings.map((mapping) => mapping.mode)).to.eql(['copy']);
      expect(requiredDescendant.mappings.map((mapping) => mapping.mode)).to.eql([
        'copy',
        'index',
      ]);
    });
  });
});
