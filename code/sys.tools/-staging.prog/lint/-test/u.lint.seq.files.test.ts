import { type t, describe, it, expect } from '../../-test.ts';
import { buildSequenceFilepathIssue } from '../u.lint.seq.files.ts';

describe('Lint: slug/sequence: files', () => {
  const docid = 'crdt:test-doc' as t.Crdt.Id;

  const makeArgs = (args: Partial<t.SlugMediaWalkArgs> = {}): t.SlugMediaWalkArgs => ({
    kind: args.kind ?? 'video',
    raw: args.raw ?? '/:core/example.webm',
    resolvedPath: args.resolvedPath ?? '/abs/path/example.webm',
    exists: args.exists ?? true,
    error: args.error,
  });

  describe('buildSequenceFilepathIssue', () => {
    it('returns undefined for existing paths (no lint)', async () => {
      const args = makeArgs({
        exists: true,
        error: undefined,
      });

      const issue = await buildSequenceFilepathIssue(docid, args);
      expect(issue).to.eql(undefined);
    });

    it('yields a "not found" lint for missing video file', async () => {
      const resolvedPath = '/abs/path/missing.webm';
      const raw = '/:core-videos/missing.webm';

      const args = makeArgs({
        kind: 'video',
        raw,
        resolvedPath,
        exists: false,
        error: undefined,
      });

      const issue = await buildSequenceFilepathIssue(docid, args);
      expect(issue).to.not.eql(undefined);

      if (!issue) return; // type guard for TS

      expect(issue.kind).to.eql('video-path:not-found');
      expect(issue.severity).to.eql('error');
      expect(issue.path).to.eql(resolvedPath);
      expect(issue.raw).to.eql(raw);
      expect(issue.doc.id).to.eql(docid);
    });

    it('yields a resolution-error lint when walker reports an error', async () => {
      const raw = '/:core-videos/broken-alias.webm';
      const args = makeArgs({
        raw,
        resolvedPath: '',
        exists: false,
        error: new Error('Alias resolution failed'),
      });

      const issue = await buildSequenceFilepathIssue(docid, args);
      expect(issue).to.not.eql(undefined);

      if (!issue) return;

      expect(issue.kind).to.eql('video-path:not-found');
      expect(issue.severity).to.eql('error');
      expect(issue.path).to.eql(raw);
      expect(issue.raw).to.eql(raw);
      expect(issue.doc.id).to.eql(docid);
      expect(issue.message).to.contain('Alias resolution failed');
    });

    it('uses image-specific kind for image paths', async () => {
      const args = makeArgs({
        kind: 'image',
        raw: '/:core-images/example.png',
        resolvedPath: '/abs/path/example.png',
        exists: false,
      });

      const issue = await buildSequenceFilepathIssue(docid, args);
      expect(issue).to.not.eql(undefined);

      if (!issue) return;

      expect(issue.kind).to.eql('image-path:not-found');
      expect(issue.path).to.eql('/abs/path/example.png');
    });
  });
});
