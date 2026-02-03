import { type t, describe, expect, Fs, it } from '../../../-test.ts';
import { resolveMappingsForStaging } from '../u/u.resolveMappingsForStaging.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';

describe('Deploy: resolveMappingsForStaging', () => {
  it('expands shard templates when configured', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/video/partition-0`);
      await Fs.ensureDir(`${tmp}/src/video/partition-1`);
      await Fs.ensureDir(`${tmp}/src/video/partition-2`);

      const res = await resolveMappingsForStaging({
        cwd: tmp as t.StringDir,
        yamlPath: './noop.yaml',
        yaml: {
          source: { dir: './src' },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: {
                source: './video/partition-<shard>',
                staging: './<shard>.video.cdn.example',
              },
              shards: { total: 3 },
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

  it('does not expand when no templates are present', async () => {
    const res = await resolveMappingsForStaging({
      cwd: '/tmp',
      yamlPath: './noop.yaml',
      yaml: {
        staging: { dir: './staging' },
        mappings: [
          {
            mode: 'copy',
            dir: {
              source: './video/program',
              staging: './video.cdn.example',
            },
            shards: { total: 5 },
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
        cwd: tmp as t.StringDir,
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
});
